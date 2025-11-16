package ch.mas802.train.boundary;

import java.time.Instant;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;

import io.quarkus.vertx.http.runtime.filters.Filters;
import io.vertx.ext.web.RoutingContext;

/**
 * Global HTTP filter that redirects traffic from t.802.ch to train.802.ch
 * and appends a timestamp query parameter so the backend can validate it.
 */
@ApplicationScoped
public class RedirectFilter {

    private static final String SOURCE_HOST = "t.802.ch";
    private static final String TARGET_HOST = "https://train.802.ch";

    public static final String TOKEN_PARAM = "token";

    public void register(@Observes Filters filters) {
        filters.register(this::handleRedirect, 10);
    }

    private void handleRedirect(RoutingContext context) {
        String hostHeader = context.request().host();
        if (hostHeader == null) {
            context.next();
            return;
        }

        String requestHost = hostHeader.split(":")[0];
        if (!SOURCE_HOST.equalsIgnoreCase(requestHost)) {
            context.next();
            return;
        }

        String originalUri = context.request().uri();
        String timestampParameter = TOKEN_PARAM + "=" + Instant.now().getEpochSecond();
        String separator = originalUri.contains("?") ? "&" : "?";

        String location = TARGET_HOST + originalUri + separator + timestampParameter;
        context.response()
                .setStatusCode(302)
                .putHeader("Location", location)
                .end();
        // Intentionally do not call next(); we terminate the request with the redirect response.
    }
}
