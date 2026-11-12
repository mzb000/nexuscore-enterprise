FROM kong:3.8-alpine

USER root

# Copy declarative config and custom plugins
COPY config/routes.yaml /etc/kong/kong.yml
COPY plugins/rate_limiter.lua /usr/local/share/lua/5.1/kong/plugins/rate_limiter/handler.lua

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr

USER kong

EXPOSE 8000 8443 8001 8444
