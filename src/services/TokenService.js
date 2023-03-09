import instance from "./config";

const TokenService = {
  getTokenAsync: async (data) => {
    try {
      const response = await instance.post("/Instagram/GetToken", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }};

export default TokenService;
