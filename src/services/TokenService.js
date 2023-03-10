import instance from "./config";

const TokenService = {
  /**
   *
   * @param {string} data
   * @return {JSON} access token
   */
  getTokenAsync: async (data) => {
    try {
      const response = await instance.post("/Instagram/GetToken", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }};

export default TokenService;
