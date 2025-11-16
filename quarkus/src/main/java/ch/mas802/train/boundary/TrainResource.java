package ch.mas802.train.boundary;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.inject.Inject;
import ch.mas802.train.entity.Status;
import ch.mas802.train.entity.Result;
import java.util.List;
import java.util.Map;

import ch.mas802.train.control.WsService;

@Path("/train")
public class TrainResource {

    @Inject
    WsService wsService;

    List<String> alwaysOnList = List.of("NONE", "GUGGE", "SANTA");

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Status toggle(@QueryParam(value="key") String key) {
//        if (key.length() > 10 || !"".equals(key.replaceAll("^[A-Z]", ""))) return null;
        if (alwaysOnList.contains(key)) {
            return new Status("ON", 0, 0);
        }

        return wsService.triggerOrToggle(key);
    }

    @Path("/info")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Status info(@QueryParam(value="key") String key) {
//        if (key.length() > 10 || !"".equals(key.replaceAll("^[A-Z]", ""))) return null;
        if (alwaysOnList.contains(key)) {
            return  new Status("ON", 0, 0);
        }

        return wsService.info(key);
    }


    @Path("/status")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Status> status() {
        return wsService.status();
    }

    @Path("/direct")
    @POST
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("direct")
    public Result directCommand(String payload) {
        if (payload == null || payload.trim().isEmpty()) {
            return new Result(false, 400, "command must not be empty");
        }

        String sanitizedPayload = payload.trim();
        int equalsIdx = sanitizedPayload.indexOf('=');
        if (equalsIdx >= 0) {
            sanitizedPayload = sanitizedPayload.substring(equalsIdx + 1).trim();
        }

        int newlineIdx = sanitizedPayload.indexOf('\n');
        if (newlineIdx >= 0) {
            sanitizedPayload = sanitizedPayload.substring(0, newlineIdx).trim();
        }

        wsService.broadcast(sanitizedPayload);
        return new Result(true, 200, "command sent");
    }
}
