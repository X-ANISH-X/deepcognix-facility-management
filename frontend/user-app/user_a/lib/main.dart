import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'src/screens/home_screen.dart';
import 'src/screens/splash_screen.dart';

import 'src/controllers/auth_controller.dart';
import 'src/controllers/register_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';
import 'src/controllers/booking_controller.dart';
import 'src/controllers/theme_controller.dart';
import 'src/controllers/language_controller.dart';

import 'src/translations/app_translations.dart';
import 'src/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await GetStorage.init();

  /// Core controllers
  Get.put(AuthController(), permanent: true);
  Get.put(ThemeController(), permanent: true);
  Get.put(LanguageController(), permanent: true);

  /// Lazy controllers (loaded when needed)
  Get.lazyPut(() => RegisterController());
  Get.lazyPut(() => HomeController());
  Get.lazyPut(() => PackageController());
  Get.lazyPut(() => BookingController());

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {

    final themeController = Get.find<ThemeController>();
    final languageController = Get.find<LanguageController>();

    return Obx(() {

      final locale = languageController.locale.value;
      final bool isLoggedIn = AuthService().isLoggedIn;

      return GetMaterialApp(

        debugShowCheckedModeBanner: false,

        title: "DeepCognix User App",

        /// ---------------- TRANSLATIONS ----------------
        translations: AppTranslations(),
        locale: locale,
        fallbackLocale: const Locale('en'),

        builder: (context, child) {
          return Directionality(
            textDirection:
                locale.languageCode == "ar"
                    ? TextDirection.rtl
                    : TextDirection.ltr,
            child: child!,
          );
        },

        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],

        supportedLocales: const [
          Locale('en'),
          Locale('ar'),
        ],

        /// ---------------- THEMES ----------------
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

        /// ---------------- INITIAL SCREEN ----------------
        home: isLoggedIn
            ? HomeScreen()
            : SplashScreen(),
      );
    });
  }
}