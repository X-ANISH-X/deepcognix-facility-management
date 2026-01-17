import 'package:flutter/material.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Register")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(decoration: InputDecoration(labelText: "Name")),
            SizedBox(height: 15),
            TextField(decoration: InputDecoration(labelText: "Email")),
            SizedBox(height: 15),
            TextField(decoration: InputDecoration(labelText: "Password")),
            SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {},
              child: Text("Create Account"),
            )
          ],
        ),
      ),
    );
  }
}
