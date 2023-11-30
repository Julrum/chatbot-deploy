export const fetchJSON = (
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  // token: string,
  url: string,
  body?: object
) =>
  fetch(`${process.env.REACT_APP_API_URL}` + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    let response = null;

    if (contentType === null) return null;
    else if (contentType.startsWith("application/json"))
      response = await res.json();
    else if (
      contentType.startsWith("text/plain") ||
      contentType.startsWith("text/html")
    ) {
      response = await res.text();
    } else
      return Promise.reject(
        new Error(`Unsupported response content-type: ${contentType}`)
      );

    if (!res.ok)
      return Promise.reject(new Error(response.message ?? response.error));

    return response;
  });
