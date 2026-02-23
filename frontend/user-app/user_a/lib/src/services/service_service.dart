import 'api_client.dart';

class ServiceService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getServices() async {
    final response = await _api.get("/services");
    return response;
  }
}
