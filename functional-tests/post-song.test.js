const API_URL = "https://huhwadu4w4.execute-api.eu-west-2.amazonaws.com";
const ENDPOINT = "song";
describe("POST /song", () => {
  const endpoint_url = `${API_URL}/${ENDPOINT}`;

  it("test runs", async () => {
    const response = await fetch(endpoint_url, { method: "POST" });

    const respData = await response.text();
    const respStatus = response.status;

    expect(respStatus).toBe(200);
    // expect(respData).toBe("Hello World! Test2");
  }, 25000);
});
