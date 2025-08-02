import { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';

interface WebRTCUser {
  id: string;
  userId: number;
  stream?: MediaStream;
}

export const useWebRTC = (channelId: number | null, currentUserId: number) => {
  const [connectedUsers, setConnectedUsers] = useState<WebRTCUser[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && channelId) {
        socketService.sendWebRTCSignal({
          type: 'ice-candidate',
          candidate: event.candidate,
          target: userId
        }, channelId);
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setConnectedUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, stream: remoteStream } : user
        )
      );
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(userId, peerConnection);
    return peerConnection;
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsAudioEnabled(true);

      peerConnectionsRef.current.forEach((peerConnection) => {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      });

      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  };

  const stopAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsAudioEnabled(false);
  };

  const handleWebRTCSignal = async (data: any) => {
    const { signal, from: fromId } = data;
    
    if (!channelId) return;

    let peerConnection = peerConnectionsRef.current.get(fromId);
    if (!peerConnection) {
      peerConnection = createPeerConnection(fromId);
      setConnectedUsers(prev => [...prev, { id: fromId, userId: data.userId }]);
    }

    try {
      if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(signal);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socketService.sendWebRTCSignal({
          type: 'answer',
          ...answer,
          target: fromId
        }, channelId);
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(signal);
      } else if (signal.type === 'ice-candidate') {
        await peerConnection.addIceCandidate(signal.candidate);
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
    }
  };

  const initiateCall = async (targetUserId: string) => {
    if (!channelId) return;

    const peerConnection = createPeerConnection(targetUserId);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketService.sendWebRTCSignal({
        type: 'offer',
        ...offer,
        target: targetUserId
      }, channelId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  useEffect(() => {
    if (channelId) {
      socketService.onWebRTCSignal(handleWebRTCSignal);
    }

    return () => {
      peerConnectionsRef.current.forEach((peerConnection) => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      setConnectedUsers([]);
    };
  }, [channelId]);

  return {
    connectedUsers,
    isAudioEnabled,
    startAudio,
    stopAudio,
    initiateCall
  };
};