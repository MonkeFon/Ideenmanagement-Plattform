# syntax=docker/dockerfile:1.6

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ideenmanagment-plattform.sln ./
COPY ideenmanagment-plattform/ ./ideenmanagment-plattform/

RUN dotnet restore ideenmanagment-plattform.sln
RUN dotnet publish ideenmanagment-plattform/ideenmanagment-plattform.csproj \
    -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app \
 && mkdir -p /app/uploads /app/logs && chown -R app:app /app

COPY --from=build /app/publish ./
USER app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "IdeaPlatform.Api.dll"]

