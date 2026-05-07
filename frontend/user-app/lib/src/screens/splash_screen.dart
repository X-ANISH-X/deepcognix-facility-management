
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/services/auth_service.dart';

class SplashScreen
    extends StatefulWidget {

  const SplashScreen({
    super.key,
  });

  @override
  State<SplashScreen>
      createState() =>
          _SplashScreenState();
}

class _SplashScreenState
    extends State<
        SplashScreen> {

  final AuthService
      authService =
          Get.find<AuthService>();

  @override
  void initState() {
    super.initState();

    _initializeApp();
  }

  // =========================================================
  // INITIALIZATION
  // =========================================================
  Future<void>
      _initializeApp() async {

    await Future.delayed(
      const Duration(
        seconds: 2,
      ),
    );

    if (!mounted) {
      return;
    }

    try {

      // ===============================================
      // REMEMBER SESSION DISABLED
      // ===============================================
      if (!authService
          .shouldRestoreSession) {

        await authService
            .logout();

        if (!mounted) {
          return;
        }

        Get.offAllNamed(
          '/login',
        );

        return;
      }

      // ===============================================
      // TOKEN EXPIRED
      // ===============================================
      if (authService
          .isTokenExpired) {

        await authService
            .logout();

        if (!mounted) {
          return;
        }

        Get.offAllNamed(
          '/login',
        );

        return;
      }

      // ===============================================
      // VALID SESSION
      // ===============================================
      if (authService
          .isLoggedIn) {

        Get.offAllNamed(
          '/home',
        );

      } else {

        Get.offAllNamed(
          '/login',
        );
      }

    } catch (_) {

      if (!mounted) {
        return;
      }

      Get.offAllNamed(
        '/login',
      );
    }
  }

  @override
  Widget build(
    BuildContext context,
  ) {

    return Scaffold(
      body: Container(
        width:
            double.infinity,

        decoration:
            const BoxDecoration(
          gradient:
              LinearGradient(
            colors: [

              Color(
                0xFF00897B,
              ),

              Color(
                0xFF26A69A,
              ),
            ],

            begin:
                Alignment.topLeft,

            end:
                Alignment
                    .bottomRight,
          ),
        ),

        child: Center(
          child:
              TweenAnimationBuilder<
                  double>(
            tween: Tween(
              begin: 0.88,
              end: 1,
            ),

            duration:
                const Duration(
              milliseconds: 900,
            ),

            curve:
                Curves.easeOutBack,

            builder:
                (
              context,
              scale,
              child,
            ) {

              return Opacity(
                opacity:
                    scale.clamp(
                  0.0,
                  1.0,
                ),

                child:
                    Transform.scale(
                  scale: scale,

                  child: child,
                ),
              );
            },

            child: const Column(
              mainAxisAlignment:
                  MainAxisAlignment
                      .center,

              children: [

                Icon(
                  Icons
                      .cleaning_services,

                  size: 82,

                  color:
                      Colors.white,
                ),

                SizedBox(
                  height: 24,
                ),

                Text(
                  "CARTEL STAR BUILDING",

                  textAlign:
                      TextAlign.center,

                  style: TextStyle(
                    fontSize: 30,

                    fontWeight:
                        FontWeight
                            .bold,

                    color:
                        Colors.white,

                    letterSpacing:
                        2,
                  ),
                ),

                SizedBox(
                  height: 8,
                ),

                Text(
                  "CLEANING SERVICES LLC",

                  style: TextStyle(
                    fontSize: 16,

                    color:
                        Colors.white70,
                  ),
                ),

                SizedBox(
                  height: 32,
                ),

                SizedBox(
                  height: 26,
                  width: 26,

                  child:
                      CircularProgressIndicator(
                    strokeWidth:
                        2.4,

                    color:
                        Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

