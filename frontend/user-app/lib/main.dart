import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

// ─────────────────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────────────────
import 'src/screens/splash_screen.dart';
import 'src/screens/home_screen.dart';
import 'src/screens/login_screen.dart';
import 'src/screens/register_screen.dart';
import 'src/screens/booking_screen.dart';
import 'src/screens/package_selection_screen.dart';
import 'src/screens/booking_summary_screen.dart';
import 'src/screens/support_contact_screen.dart';
import 'src/screens/upcoming_bookings_screen.dart';
import 'src/screens/booking_status_screen.dart';
import 'src/screens/profile_screen.dart';
import 'src/screens/map_picker_screen.dart';
import 'src/screens/tracking_screen.dart';
import 'src/screens/live_tracking_screen.dart';
import 'src/screens/checklist_progress_screen.dart';

// ─────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────
import 'src/controllers/auth_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';
import 'src/controllers/booking_controller.dart';
import 'src/controllers/user_controller.dart';
import 'src/controllers/theme_controller.dart';
import 'src/controllers/language_controller.dart';
import 'src/controllers/register_controller.dart';

// ─────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────
import 'src/services/auth_service.dart';

// ─────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────
import 'src/translations/app_translations.dart';

void main() async {

  WidgetsFlutterBinding.ensureInitialized();

  await GetStorage.init();

  // ======================================================
  // PERMANENT SERVICES
  // ======================================================
  Get.put(
    AuthService(),
    permanent: true,
  );

  Get.put(
    AuthController(),
    permanent: true,
  );

  Get.put(
    ThemeController(),
    permanent: true,
  );

  Get.put(
    LanguageController(),
    permanent: true,
  );

  // ======================================================
  // LAZY CONTROLLERS
  // ======================================================
  Get.lazyPut(
    () => RegisterController(),
    fenix: true,
  );

  Get.lazyPut(
    () => HomeController(),
    fenix: true,
  );

  Get.lazyPut(
    () => PackageController(),
    fenix: true,
  );

  Get.lazyPut(
    () => BookingController(),
    fenix: true,
  );

  Get.lazyPut(
    () => UserController(),
    fenix: true,
  );

  runApp(
    const MyApp(),
  );
}

class MyApp extends StatelessWidget {

  const MyApp({
    super.key,
  });

  static const Color brandColor =
      Color(0xFF0FB9B1);

  static const Color cardColor =
      Color(0xFFF7F9FA);

  static const Color borderColor =
      Color(0xFFE5E5EA);

  @override
  Widget build(
    BuildContext context,
  ) {

    final themeController =
        Get.find<ThemeController>();

    final languageController =
        Get.find<LanguageController>();

    return Obx(() {

      final locale =
          languageController
              .locale
              .value;

      return GetMaterialApp(

        debugShowCheckedModeBanner:
            false,

        title:
            'DeepCognix User App',

        // ==================================================
        // TRANSLATIONS
        // ==================================================
        translations:
            AppTranslations(),

        locale: locale,

        fallbackLocale:
            const Locale('en'),

        supportedLocales:
            const [

          Locale('en'),

          Locale('ar'),
        ],

        localizationsDelegates:
            const [

          GlobalMaterialLocalizations
              .delegate,

          GlobalWidgetsLocalizations
              .delegate,

          GlobalCupertinoLocalizations
              .delegate,
        ],

        builder:
            (context, child) {

          return Directionality(

            textDirection:
                locale.languageCode ==
                        'ar'
                    ? TextDirection.rtl
                    : TextDirection.ltr,

            child: child!,
          );
        },

        // ==================================================
        // LIGHT THEME
        // ==================================================
        theme: ThemeData(

          useMaterial3: true,

          brightness:
              Brightness.light,

          scaffoldBackgroundColor:
              const Color(
            0xFFF4F7FB,
          ),

          colorScheme:
              ColorScheme.fromSeed(
            seedColor:
                brandColor,
          ),

          appBarTheme:
              const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            backgroundColor:
                Colors.transparent,
            foregroundColor:
                Colors.black,
          ),

          cardColor:
              Colors.white,

          elevatedButtonTheme:
              ElevatedButtonThemeData(
            style:
                ElevatedButton.styleFrom(
              backgroundColor:
                  brandColor,

              foregroundColor:
                  Colors.white,

              minimumSize:
                  const Size(
                double.infinity,
                50,
              ),

              shape:
                  RoundedRectangleBorder(
                borderRadius:
                    BorderRadius.circular(
                  14,
                ),
              ),
            ),
          ),

          inputDecorationTheme:
              InputDecorationTheme(

            filled: true,

            fillColor:
                cardColor,

            contentPadding:
                const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),

            border:
                OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(
                14,
              ),

              borderSide:
                  const BorderSide(
                color:
                    borderColor,
              ),
            ),

            enabledBorder:
                OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(
                14,
              ),

              borderSide:
                  const BorderSide(
                color:
                    borderColor,
              ),
            ),

            focusedBorder:
                OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(
                14,
              ),

              borderSide:
                  const BorderSide(
                color:
                    brandColor,
                width: 1.5,
              ),
            ),
          ),
        ),

        // ==================================================
        // DARK THEME
        // ==================================================
        darkTheme: ThemeData(

          useMaterial3: true,

          brightness:
              Brightness.dark,

          scaffoldBackgroundColor:
              const Color(
            0xFF0B1220,
          ),

          colorScheme:
              ColorScheme.fromSeed(
            seedColor:
                brandColor,
            brightness:
                Brightness.dark,
          ),

          appBarTheme:
              const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            backgroundColor:
                Colors.transparent,
            foregroundColor:
                Colors.white,
          ),

          cardColor:
              const Color(
            0xFF172033,
          ),

          elevatedButtonTheme:
              ElevatedButtonThemeData(
            style:
                ElevatedButton.styleFrom(
              backgroundColor:
                  brandColor,

              foregroundColor:
                  Colors.white,

              minimumSize:
                  const Size(
                double.infinity,
                50,
              ),

              shape:
                  RoundedRectangleBorder(
                borderRadius:
                    BorderRadius.circular(
                  14,
                ),
              ),
            ),
          ),
        ),

        themeMode:
            themeController
                    .isDark
                    .value
                ? ThemeMode.dark
                : ThemeMode.light,

        // ==================================================
        // INITIAL ROUTE
        // ==================================================
        initialRoute:
            '/splash',

        // ==================================================
        // ROUTES
        // ==================================================
        getPages: [

          GetPage(
            name: '/splash',
            page: () =>
                const SplashScreen(),
          ),

          GetPage(
            name: '/login',
            page: () =>
                LoginScreen(),
          ),

          GetPage(
            name: '/register',
            page: () =>
                RegisterScreen(),
          ),

          GetPage(
            name: '/home',
            page: () =>
                HomeScreen(),
          ),

          GetPage(
            name: '/booking',
            page: () =>
                BookingScreen(),
          ),

          // ================================================
          // FIXED ROUTE
          // ================================================
          GetPage(
            name:
                '/package-selection',

            page: () =>
                const PackageSelectionScreen(),
          ),

          GetPage(
            name:
                '/booking-summary',

            page: () =>
                BookingSummaryScreen(),
          ),

          GetPage(
            name:
                '/support-contact',

            page: () =>
                const SupportContactScreen(),
          ),

          GetPage(
            name: '/upcoming',
            page: () =>
                UpcomingBookingsScreen(),
          ),

          GetPage(
            name:
                '/booking-status',

            page: () =>
                BookingStatusScreen(),
          ),

          GetPage(
            name: '/profile',
            page: () =>
                ProfileScreen(),
          ),

          GetPage(
            name:
                '/map-picker',

            page: () =>
                MapPickerScreen(),
          ),

          GetPage(
            name:
                '/tracking',

            page: () =>
                const TrackingScreen(),
          ),

          GetPage(
            name:
                '/live-tracking',

            page: () =>
                const LiveTrackingScreen(),
          ),

          GetPage(
            name:
                '/checklist-progress',

            page: () =>
                ChecklistProgressScreen(),
          ),
        ],
      );
    });
  }
}