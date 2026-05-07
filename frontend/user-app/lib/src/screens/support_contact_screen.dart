import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/services/auth_service.dart';

class SupportContactScreen
    extends StatefulWidget {

  const SupportContactScreen({
    super.key,
  });

  @override
  State<SupportContactScreen>
      createState() =>
          _SupportContactScreenState();
}

class _SupportContactScreenState
    extends State<
        SupportContactScreen> {

  final AuthService _auth =
      Get.find<AuthService>();

  final TextEditingController
      _messageController =
          TextEditingController();

  final TextEditingController
      _nameController =
          TextEditingController();

  final TextEditingController
      _emailController =
          TextEditingController();

  final TextEditingController
      _phoneController =
          TextEditingController();

  bool _isSending = false;

  late String _selectedType;

  static const String
      supportPhone =
          '+971 50 123 4567';

  static const String
      supportEmail =
          'support@deepcognix.com';

  final List<String>
      inquiryTypes = [

    "Commercial Cleaning",

    "Warehouse Cleaning",

    "Office Cleaning",

    "Custom Service Request",

    "General Support",
  ];

  @override
  void initState() {
    super.initState();

    final category =
        (Get.arguments
                as String?) ??
            'Support';

    _selectedType =
        category == "Commercial"
            ? "Commercial Cleaning"
            : "General Support";

    _nameController.text =
        _auth.fullName ?? '';

    _emailController.text =
        _auth.email ?? '';

    _phoneController.text =
        _auth.phone ?? '';
  }

  @override
  void dispose() {

    _messageController.dispose();

    _nameController.dispose();

    _emailController.dispose();

    _phoneController.dispose();

    super.dispose();
  }

  Future<void>
      _submitSupportRequest() async {

    final message =
        _messageController.text
            .trim();

    if (message.isEmpty) {

      Get.snackbar(
        'Support Request',
        'Please enter your message.',
      );

      return;
    }

    setState(() {
      _isSending = true;
    });

    try {

      await Future.delayed(
        const Duration(
          seconds: 1,
        ),
      );

      if (!mounted) return;

      Get.dialog(
        AlertDialog(
          shape:
              RoundedRectangleBorder(
            borderRadius:
                BorderRadius
                    .circular(
              18,
            ),
          ),

          title: const Text(
            'Request Sent',
          ),

          content: const Text(
            'Your message has been sent successfully. Our support team will contact you shortly.',
          ),

          actions: [

            ElevatedButton(
              onPressed: () {

                Get.back();
                Get.back();
              },

              child:
                  const Text(
                'Done',
              ),
            ),
          ],
        ),
      );

      _messageController.clear();

    } finally {

      if (mounted) {

        setState(() {
          _isSending = false;
        });
      }
    }
  }

  @override
  Widget build(
    BuildContext context,
  ) {

    final theme =
        Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title:
            const Text(
          'Customer Support',
        ),
      ),

      body: ListView(
        padding:
            const EdgeInsets.all(
          16,
        ),

        children: [

          Container(
            padding:
                const EdgeInsets.all(
              18,
            ),

            decoration:
                BoxDecoration(
              color:
                  theme.cardColor,

              borderRadius:
                  BorderRadius
                      .circular(
                20,
              ),
            ),

            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment
                      .start,

              children: [

                const Text(
                  'Support Contact Details',

                  style: TextStyle(
                    fontSize: 18,
                    fontWeight:
                        FontWeight.bold,
                  ),
                ),

                const SizedBox(
                  height: 16,
                ),

                Row(
                  children: [

                    const Icon(
                      Icons.phone,
                    ),

                    const SizedBox(
                      width: 10,
                    ),

                    Text(
                      supportPhone,
                    ),
                  ],
                ),

                const SizedBox(
                  height: 12,
                ),

                Row(
                  children: [

                    const Icon(
                      Icons.email,
                    ),

                    const SizedBox(
                      width: 10,
                    ),

                    Text(
                      supportEmail,
                    ),
                  ],
                ),

                const SizedBox(
                  height: 12,
                ),

                const Text(
                  'Our team usually responds within a few minutes during working hours.',
                ),
              ],
            ),
          ),

          const SizedBox(
            height: 24,
          ),

          DropdownButtonFormField<String>(
            value: _selectedType,

            decoration:
                const InputDecoration(
              labelText:
                  'Inquiry Type',
            ),

            items:
                inquiryTypes
                    .map(
                      (type) =>
                          DropdownMenuItem(
                        value: type,

                        child: Text(
                          type,
                        ),
                      ),
                    )
                    .toList(),

            onChanged: (value) {

              if (value != null) {

                setState(() {
                  _selectedType =
                      value;
                });
              }
            },
          ),

          const SizedBox(
            height: 14,
          ),

          TextField(
            controller:
                _nameController,

            decoration:
                const InputDecoration(
              labelText: 'Name',
            ),
          ),

          const SizedBox(
            height: 14,
          ),

          TextField(
            controller:
                _emailController,

            decoration:
                const InputDecoration(
              labelText: 'Email',
            ),
          ),

          const SizedBox(
            height: 14,
          ),

          TextField(
            controller:
                _phoneController,

            decoration:
                const InputDecoration(
              labelText: 'Phone',
            ),
          ),

          const SizedBox(
            height: 14,
          ),

          TextField(
            controller:
                _messageController,

            minLines: 5,

            maxLines: 7,

            decoration:
                const InputDecoration(
              labelText:
                  'Message',

              alignLabelWithHint:
                  true,
            ),
          ),

          const SizedBox(
            height: 24,
          ),

          SizedBox(
            width:
                double.infinity,

            child:
                ElevatedButton(
              onPressed:
                  _isSending
                      ? null
                      : _submitSupportRequest,

              child:
                  _isSending
                      ? const SizedBox(
                          height: 20,
                          width: 20,

                          child:
                              CircularProgressIndicator(
                            strokeWidth:
                                2,

                            color:
                                Colors.white,
                          ),
                        )
                      : const Text(
                          'Send Message',
                        ),
            ),
          ),
        ],
      ),
    );
  }
}