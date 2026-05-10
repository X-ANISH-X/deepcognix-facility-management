import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/services/api_client.dart';
import 'package:user_a/src/services/auth_service.dart';

class SupportContactScreen extends StatefulWidget {
  const SupportContactScreen({super.key});

  @override
  State<SupportContactScreen> createState() => _SupportContactScreenState();
}

class _SupportContactScreenState extends State<SupportContactScreen> {
  final ApiClient _api = ApiClient();
  final AuthService _auth = Get.find<AuthService>();
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  bool _isSending = false;

  static const String supportPhone = '+971 50 123 4567';
  static const String supportEmail = 'support@deepcognix.com';

  @override
  void initState() {
    super.initState();
    final category = (Get.arguments as String?) ?? 'Support';
    _subjectController.text = '$category Inquiry';
    _nameController.text = _auth.fullName ?? '';
    _emailController.text = _auth.email ?? '';
    _phoneController.text = _auth.phone ?? '';
  }

  @override
  void dispose() {
    _messageController.dispose();
    _subjectController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submitSupportRequest() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) {
      Get.snackbar('Support Request', 'Please write your message first.');
      return;
    }

    setState(() => _isSending = true);
    try {
      await _api.postSupportContact(
        subject: _subjectController.text.trim(),
        message: message,
        name: _nameController.text.trim().isEmpty
            ? null
            : _nameController.text.trim(),
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        phone: _phoneController.text.trim().isEmpty
            ? null
            : _phoneController.text.trim(),
      );

      Get.snackbar('Support Request', 'Your message was sent to support.');
      _messageController.clear();
    } catch (e) {
      Get.snackbar('Support Request Failed', e.toString());
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Support'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: theme.dividerColor.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Contact Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 12),
                Text('Phone: $supportPhone'),
                SizedBox(height: 6),
                Text('Email: $supportEmail'),
                SizedBox(height: 6),
                Text('We usually respond within a few minutes.'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _subjectController,
            decoration: const InputDecoration(labelText: 'Subject'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            decoration: const InputDecoration(labelText: 'Phone'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _messageController,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Message',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSending ? null : _submitSupportRequest,
              child: Text(_isSending ? 'Sending...' : 'Send Message'),
            ),
          ),
        ],
      ),
    );
  }
}
