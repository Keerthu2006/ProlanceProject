import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Real-time WebSocket hook.
 * Subscribes to two STOMP topics pushed by the Spring Boot backend:
 *   /topic/owner-alerts     – new AI recommendation produced
 *   /topic/automation-log   – automation action executed
 */
export function useDashboardSocket({ onAlert, onAutomation, enabled = true }) {
  const clientRef = useRef(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/owner-alerts', (msg) => {
          try { onAlert?.(JSON.parse(msg.body)); } catch {}
        });
        client.subscribe('/topic/automation-log', (msg) => {
          try { onAutomation?.(JSON.parse(msg.body)); } catch {}
        });
      },
    });
    client.activate();
    clientRef.current = client;
  }, [enabled, onAlert, onAutomation]);

  useEffect(() => {
    connect();
    return () => clientRef.current?.deactivate();
  }, [connect]);
}