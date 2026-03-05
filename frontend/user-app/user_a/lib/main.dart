import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'src/screens/login_screen.dart';
import 'src/screens/home_screen.dart';
import 'src/controllers/register_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';
import 'src/controllers/booking_controller.dart';
import 'src/controllers/theme_controller.dart';
import 'src/translations/app_translations.dart';
import 'src/controllers/language_controller.dart';
import 'src/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GetStorage.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.put(ThemeController());
    final languageController = Get.put(LanguageController());

    // 🔥 CHECK IF USER ALREADY LOGGED IN
    final bool isLoggedIn = AuthService().isLoggedIn;

    return Obx(
      () => GetMaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'User App',

        // 🌍 TRANSLATIONS
        translations: AppTranslations(),
        locale: languageController.locale.value,
        fallbackLocale: const Locale('en'),

        // 🌍 FLUTTER LOCALIZATION (DATE PICKER)
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],

        supportedLocales: const [
          Locale('en'),
          Locale('ar'),
        ],

        // 🎨 THEMES
        theme: ThemeData.light().copyWith(
          primaryColor: Colors.teal,
          scaffoldBackgroundColor: Colors.white,
        ),

        darkTheme: ThemeData.dark().copyWith(
          primaryColor: Colors.teal,
        ),

        themeMode: themeController.isDark.value
            ? ThemeMode.dark
            : ThemeMode.light,

        // 🧠 CONTROLLERS
        initialBinding: BindingsBuilder(() {
          Get.put(RegisterController());
          Get.put(HomeController());
          Get.put(PackageController());
          Get.put(BookingController());
        }),

        // 🔥 AUTO LOGIN LOGIC
        home: isLoggedIn ? const HomeScreen() : LoginScreen(),
      ),
    );
  }
}
