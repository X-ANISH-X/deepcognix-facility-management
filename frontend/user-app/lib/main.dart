import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

// ── Screens ──────────────────────────────────────────────────────────
import 'src/screens/splash_screen.dart';
import 'src/screens/home_screen.dart';
import 'src/screens/login_screen.dart';
import 'src/screens/register_screen.dart';
import 'src/screens/booking_screen.dart';
import 'src/screens/upcoming_bookings_screen.dart';
import 'src/screens/booking_status_screen.dart';
import 'src/screens/profile_screen.dart';
import 'src/screens/map_picker_screen.dart';
import 'src/screens/tracking_screen.dart';
import 'src/screens/checklist_progress_screen.dart';

// ── Controllers ───────────────────────────────────────────────────────
import 'src/controllers/auth_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';
import 'src/controllers/booking_controller.dart';
import 'src/controllers/user_controller.dart';
import 'src/controllers/theme_controller.dart';
import 'src/controllers/language_controller.dart';
import 'src/controllers/register_controller.dart';

// ── Services ─────────────────────────────────────────────────────────
import 'src/services/auth_service.dart';

// ── Translations ─────────────────────────────────────────────────────
import 'src/translations/app_translations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GetStorage.init();

  // ── Permanent ──────────────────────────────────────────────────────
  Get.put(AuthService(), permanent: true);
  Get.put(AuthController(), permanent: true);
  Get.put(ThemeController(), permanent: true);
  Get.put(LanguageController(), permanent: true);

  // ── Lazy ──────────────────────────────────────────────────────────
  Get.lazyPut(() => RegisterController(), fenix: true);
  Get.lazyPut(() => HomeController(), fenix: true);
  Get.lazyPut(() => PackageController(), fenix: true);
  Get.lazyPut(() => BookingController(), fenix: true);
  Get.lazyPut(() => UserController(), fenix: true);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  static const Color brandColor = Color(0xFF0FB9B1);
  static const Color cardColor = Color(0xFFF7F9FA);
  static const Color borderColor = Color(0xFFE5E5EA);

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();
    final languageController = Get.find<LanguageController>();

    return Obx(() {
      final locale = languageController.locale.value;

      return GetMaterialApp(
        debugShowCheckedModeBanner: false,
        title: "DeepCognix User App",

        translations: AppTranslations(),
        locale: locale,
        fallbackLocale: const Locale('en'),

        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en'),
          Locale('ar'),
        ],

        builder: (context, child) => Directionality(
          textDirection: locale.languageCode == "ar"
              ? TextDirection.rtl
              : TextDirection.ltr,
          child: child!,
        ),

        theme: ThemeData(
          brightness: Brightness.light,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: brandColor,
            brightness: Brightness.light,
          ).copyWith(
            primary: brandColor,
            secondary: const Color(0xFF16A085),
            surface: Colors.white,
          ),
          scaffoldBackgroundColor: const Color(0xFFF4F7FB),
          appBarTheme: const AppBarTheme(
            elevation: 0,
            centerTitle: true,
            backgroundColor: Colors.transparent,
            foregroundColor: Color(0xFF1C1C1E),
          ),
          cardColor: Colors.white,
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: brandColor,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: cardColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: brandColor, width: 1.5),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        darkTheme: ThemeData(
          brightness: Brightness.dark,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: brandColor,
            brightness: Brightness.dark,
          ).copyWith(
            primary: brandColor,
            secondary: const Color(0xFF55D6BE),
            surface: const Color(0xFF172033),
          ),
          scaffoldBackgroundColor: const Color(0xFF0B1220),
          appBarTheme: const AppBarTheme(
            elevation: 0,
            centerTitle: true,
            backgroundColor: Colors.transparent,
            foregroundColor: Color(0xFFF8FAFC),
          ),
          cardColor: const Color(0xFF172033),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: brandColor,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFF172033),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF334155)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF334155)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: brandColor, width: 1.5),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        themeMode:
            themeController.isDark.value ? ThemeMode.dark : ThemeMode.light,

        /// 🔥 ALWAYS START FROM SPLASH
        initialRoute: '/splash',

        getPages: [
          GetPage(name: '/splash', page: () => SplashScreen()),
          GetPage(name: '/login', page: () => LoginScreen()),
          GetPage(name: '/register', page: () => RegisterScreen()),
          GetPage(name: '/home', page: () => HomeScreen()),
          GetPage(name: '/booking', page: () => BookingScreen()),
          GetPage(name: '/upcoming', page: () => UpcomingBookingsScreen()),
          GetPage(name: '/booking-status', page: () => BookingStatusScreen()),
          GetPage(name: '/profile', page: () => ProfileScreen()),

          /// 🔥 REQUIRED ROUTES
          GetPage(name: '/map-picker', page: () => MapPickerScreen()),
          GetPage(name: '/tracking', page: () => TrackingScreen()),
          GetPage(
              name: '/checklist-progress',
              page: () => ChecklistProgressScreen()),
        ],
      );
    });
  }
}
