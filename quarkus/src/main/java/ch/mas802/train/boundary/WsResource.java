package ch.mas802.train.boundary;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.enterprise.context.ApplicationScoped;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import javax.websocket.Session;

import javax.inject.Inject;
import ch.mas802.train.control.WsService;
import ch.mas802.train.control.TriggerService;

import org.jboss.logging.Logger;

@ServerEndpoint("/trainws/{clientname}")
@ApplicationScoped
public class WsResource {

    private static final Logger LOG = Logger.getLogger(WsResource.class);

    @Inject
    WsService wsService;
    
    @Inject
    TriggerService triggerService;

    @OnOpen
    public void onOpen(Session session, @PathParam("clientname") String clientname) {
        wsService.put(clientname, session);
    }

    @OnClose
    public void onClose(Session session, @PathParam("clientname") String clientname) {
        wsService.remove(clientname);
    }

    @OnError
    public void onError(Session session, @PathParam("clientname") String clientname, Throwable throwable) {
        wsService.remove(clientname);
    }

    @OnMessage
    public void onMessage(Session session, String message, @PathParam("clientname") String clientname) {
        String[] cmd = message.split(":");
        LOG.info(message);
        if (cmd.length == 0) {
            return;
        }

        String command = cmd[0].trim().toLowerCase();

        if ("state".equals(command) && cmd.length == 3) {
            wsService.incomingStatus(cmd[1], cmd[2], 2000);
            wsService.broadcast(message);
        } else if ("relay".equals(command)) {
            int prefixEnd = message.indexOf(':');
            if (prefixEnd >= 0 && message.length() > prefixEnd + 1) {
                wsService.broadcast(message.substring(prefixEnd + 1));
            }
        } else if ("trigger".equals(command)) {
            int prefixEnd = message.indexOf(':');
            if (prefixEnd >= 0 && message.length() > prefixEnd + 1) {
                triggerService.handleTrigger(message.substring(prefixEnd + 1)).ifPresent(wsService::broadcast);
            }
        } else {
            // wsService.broadcast(">> " + clientname + ": " + message + ": " + cmd[0] + ": " + cmd.length);
        }
    }
}
