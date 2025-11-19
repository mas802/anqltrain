package ch.mas802.train.control;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.websocket.Session;

import ch.mas802.train.entity.Status;
import ch.mas802.train.entity.StatusRepository;

@ApplicationScoped
public class WsService {

    @Inject
    StatusRepository statusRepository;

    @Inject
    TriggerService triggerService;

    Map<String, Session> sessions = new ConcurrentHashMap<>();

    public void put(String clientname, Session session) {
        sessions.put(clientname, session);
        broadcast("User " + clientname + "  joined");
    }

    public void remove(String clientname) {
        sessions.remove(clientname);
        broadcast("User " + clientname + " left");
    }

    public void broadcast(String message) {
        System.out.println("send message: " + message);
        sessions.values().forEach(s -> {
            s.getAsyncRemote().sendObject(message, result ->  {
                if (result.getException() != null) {
                    System.out.println("Unable to send message: " + result.getException());
                }
            });
        });
    }

    public void incomingStatus(final String key, final String state, final long validFor) {
        statusRepository.updateStatus(key, state, validFor);
    }

    public Status execute(final String key, final String mode) {
        Status status =  statusRepository.getStatus(key);

        if (status.until > 0 || "NONE".equals(key)) {
            return status;
        }

        long until = 500;
        if (!"load".equals(status.state)) {
          broadcast(mode+":"+key);
        } else {
          broadcast(mode+":"+key);
          until = status.deltaduration*2;
          if (until>10000) {
            return new Status("error", until*2, until, status.data);
          }
        }
        statusRepository.updateStatus(key, "load", until, status.data);
        return new Status("load", until*2, until, status.data);
    }

    public Status info(final String key) {
        return execute(key, "info");
    }

    public Status toggle(final String key) {
        return execute(key, "toggle");
    }

    public Status triggerOrToggle(final String key) {
        Status status = statusRepository.getStatus(key);
        long until = 500;

        Status adventStatus = triggerService.buildAdventStatus(key, System.currentTimeMillis());
        if (adventStatus != null) {
            return adventStatus;
        }

        System.out.println("triggerOrToggle: " + key + " - " + status.state);
    
    //    if (!"load".equals(status.state)) {
            String targetState = "ON".equals(status.state) ? "OFF" : "ON";

            System.out.println("triggerOrToggle: " + key + " - " + status.state + " to " + targetState);

            return triggerService.handleTrigger(key + ":" + targetState)
                .map(message -> {
                    System.out.println("triggerOrToggle DO: " + key + " - " + status.state + " to " + targetState);
                    broadcast(message);
                    statusRepository.updateStatus(key, targetState, 2000, status.data);
                    return new Status("load", until * 2, until, status.data);
                })
                .orElseGet(() -> {
                    System.out.println("triggerOrToggle DONT: " + key + " - " + status.state + " to " + targetState);
                    return execute(key, "toggle");
                });
    //    }

    //    statusRepository.updateStatus(key, "load", until);
    //    return new Status("load", until * 2, until);
    }

    public Map<String, Status> status() {
        return statusRepository.status();
    }

}
