const fetchApiRoot = () => {
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  if (currentPort === "6006") {
    if (currentHost === "localhost") {
      return "http://localhost:8002/";
    } else if (currentHost === "127.0.0.1") {
      return "http://127.0.0.1:8002/";
    } else if (currentHost === "0.0.0.0") {
      return "http://0.0.0.0:8002/";
    }
  }

  return "http://127.0.0.1:8002/";
};

export const API_ROOT = fetchApiRoot();
