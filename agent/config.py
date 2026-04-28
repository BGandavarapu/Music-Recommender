from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    agent_api_key: str
    agent_model: str = "meta/llama-3.3-70b-instruct"
    agent_base_url: str = "https://integrate.api.nvidia.com/v1"
    spotify_client_id: str
    spotify_client_secret: str
    spotify_redirect_uri: str = "http://127.0.0.1:5173/api/auth/callback"
    secret_key: str
    database_url: str = "sqlite+aiosqlite:///./agent.sqlite"

    model_config = SettingsConfigDict(env_file="agent/.env", extra="ignore")


settings = Settings()
