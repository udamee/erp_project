package com.erp.backend.notification.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;


//Stomp소켓을 위한 세션로거
@Component
@Slf4j
public class StompEventListener {

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        log.info("STOMP CONNECT 들어옴");
    }

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        log.info("STOMP CONNECTED 완료");
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        log.info("STOMP DISCONNECT");
    }
}
