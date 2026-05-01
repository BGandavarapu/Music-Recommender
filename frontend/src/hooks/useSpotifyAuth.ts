export function useSpotifyAuth() {
  const connect = () => {
    window.location.href = "/api/auth/login";
  };
  return { connect };
}
