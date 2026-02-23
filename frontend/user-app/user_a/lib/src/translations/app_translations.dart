import 'package:get/get.dart';

class AppTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {

    // ================= ENGLISH =================
    'en': {

      // AUTH
      'welcome_back': 'Welcome Back',
      'login_continue': 'Login to continue',
      'register': 'Register',
      'create_account': 'Create Account',
      'verification': 'Verification',
      'enter_otp': 'Enter OTP',
      'email': 'Email',
      'password': 'Password',
      'login': 'Login',
      'login_clicked': 'Login clicked (no backend yet)',
      'no_account_register': "Don't have an account? Register",
      'register_subtitle': 'Join us today',
      'name': 'Name',

      // OTP
      'otp_verification': 'OTP Verification',
      'otp_instruction': 'Enter the code sent to your email and phone',
      'verify_otp': 'Verify OTP',
      'resend_code': 'Resend Code',
      'otp_sent': 'OTP Sent',
      'otp_resent': 'A new OTP has been sent',

      // HOME
      'choose_service': 'Choose Service',

      'service_office': 'Office Cleaning',
      'service_office_desc': 'Corporate & workspace',

      'service_mall': 'Mall Cleaning',
      'service_mall_desc': 'Large retail spaces',

      'service_theater': 'Theater Cleaning',
      'service_theater_desc': 'Auditorium & lobby',

      'service_glass': 'Glass Cleaning',
      'service_glass_desc': 'Exterior & interior',

      // PACKAGE
      'select_package': 'Select Package',
      'continue': 'Continue',
      'service_checklist': 'Service Checklist',
      'tasks_included': 'Tasks included in this package',

      'pkg_basic': 'Basic',
      'pkg_basic_desc': 'Essential cleaning',

      'pkg_standard': 'Standard',
      'pkg_standard_desc': 'Most popular choice',

      'pkg_premium': 'Premium',
      'pkg_premium_desc': 'Deep cleaning',

      // TASKS
      'task_dusting': 'Dusting',
      'task_vacuuming': 'Vacuuming',
      'task_trash': 'Trash removal',
      'task_mopping': 'Mopping',
      'task_restroom': 'Restroom cleaning',
      'task_all_standard': 'All Standard tasks',
      'task_deep_cleaning': 'Deep cleaning',
      'task_carpet_cleaning': 'Carpet cleaning',

      // BOOKING
      'booking_details': 'Booking Details',
      'select_date': 'Select Date',
      'choose_date': 'Choose date',
      'select_time': 'Select Time',
      'choose_time': 'Choose time',
      'service_location': 'Service Location',
      'select_address': 'Select address',
      'payment_method': 'Payment Method',
      'pay_now': 'Pay Now',
      'pay_later': 'Pay on Completion',
      'confirm_booking': 'Confirm Booking',
      'incomplete_details': 'Incomplete Details',
      'select_all_details': 'Please select date, time and address',
      'add_new_address': 'Add New Address',
      'new_address': 'New Address',
      'enter_address': 'Enter address',
      'add': 'Add',
      'cancel': 'Cancel',

      // TRACKING
      'live_tracking': 'Live Service Tracking',
      'technician_assigned': 'Technician Assigned',
      'professional_on_way': 'Your service professional is on the way',
      'view_service_progress': 'View Service Progress',

      // STATUS
      'service_status': 'Service Status',
      'booking': 'Booking',
      'submitted': 'Submitted',
      'approved': 'Approved',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'approve_completion': 'Approve Completion',
      'service_approved': 'Service Approved',
      'completion_approved': 'Completion has been approved',
      'view_checklist_progress': 'View Checklist Progress',
      'simulate_next_status': 'Simulate Next Status',

      // PROFILE
      'profile': 'Profile',
      'phone_number': 'Phone Number',
      'location': 'Location',
      'role': 'Role',

      // NOTIFICATIONS
      'notifications': 'Notifications',
      'booking_confirmed': 'Booking Confirmed',
      'booking_approved': 'Your service booking has been approved',
      'service_assigned': 'Service Assigned',
      'technician_assigned_notification': 'A technician has been assigned',
      'service_completed': 'Service Completed',
      'review_completed': 'Please review the completed service',

      // PROGRESS
      'service_progress': 'Service Progress',
      'checklist_completion': 'Checklist Completion',
      'complete_service': 'Complete Service',
    },


    // ================= ARABIC =================
    'ar': {

      // AUTH
      'welcome_back': 'مرحبا بعودتك',
      'login_continue': 'سجل الدخول للمتابعة',
      'register': 'إنشاء حساب',
      'create_account': 'إنشاء حساب',
      'verification': 'التحقق',
      'enter_otp': 'أدخل رمز التحقق',
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور',
      'login': 'تسجيل الدخول',
      'login_clicked': 'تم الضغط على تسجيل الدخول',
      'no_account_register': 'ليس لديك حساب؟ قم بالتسجيل',
      'register_subtitle': 'انضم إلينا اليوم',
      'name': 'الاسم',

      // OTP
      'otp_verification': 'التحقق عبر OTP',
      'otp_instruction': 'أدخل الرمز المرسل إلى بريدك الإلكتروني وهاتفك',
      'verify_otp': 'تحقق من الرمز',
      'resend_code': 'إعادة إرسال الرمز',
      'otp_sent': 'تم إرسال الرمز',
      'otp_resent': 'تم إرسال رمز جديد',

      // HOME
      'choose_service': 'اختر الخدمة',

      'service_office': 'تنظيف المكاتب',
      'service_office_desc': 'الشركات ومساحات العمل',

      'service_mall': 'تنظيف المولات',
      'service_mall_desc': 'المساحات التجارية الكبيرة',

      'service_theater': 'تنظيف المسارح',
      'service_theater_desc': 'المدرجات والردهة',

      'service_glass': 'تنظيف الزجاج',
      'service_glass_desc': 'الخارجي والداخلي',

      // PACKAGE
      'select_package': 'اختر الباقة',
      'continue': 'متابعة',
      'service_checklist': 'قائمة مهام الخدمة',
      'tasks_included': 'المهام المشمولة في هذه الباقة',

      'pkg_basic': 'أساسي',
      'pkg_basic_desc': 'تنظيف أساسي',

      'pkg_standard': 'قياسي',
      'pkg_standard_desc': 'الأكثر شيوعًا',

      'pkg_premium': 'ممتاز',
      'pkg_premium_desc': 'تنظيف عميق',

      // TASKS
      'task_dusting': 'إزالة الغبار',
      'task_vacuuming': 'الكنس',
      'task_trash': 'إزالة القمامة',
      'task_mopping': 'المسح',
      'task_restroom': 'تنظيف الحمام',
      'task_all_standard': 'جميع مهام الباقة القياسية',
      'task_deep_cleaning': 'تنظيف عميق',
      'task_carpet_cleaning': 'تنظيف السجاد',

      // BOOKING
      'booking_details': 'تفاصيل الحجز',
      'select_date': 'اختر التاريخ',
      'choose_date': 'اختر تاريخًا',
      'select_time': 'اختر الوقت',
      'choose_time': 'اختر وقتًا',
      'service_location': 'موقع الخدمة',
      'select_address': 'اختر العنوان',
      'payment_method': 'طريقة الدفع',
      'pay_now': 'ادفع الآن',
      'pay_later': 'ادفع عند الانتهاء',
      'confirm_booking': 'تأكيد الحجز',
      'incomplete_details': 'بيانات غير مكتملة',
      'select_all_details': 'يرجى اختيار التاريخ والوقت والعنوان',
      'add_new_address': 'إضافة عنوان جديد',
      'new_address': 'عنوان جديد',
      'enter_address': 'أدخل العنوان',
      'add': 'إضافة',
      'cancel': 'إلغاء',

      // TRACKING
      'live_tracking': 'تتبع الخدمة المباشر',
      'technician_assigned': 'تم تعيين الفني',
      'professional_on_way': 'مزود الخدمة في طريقه إليك',
      'view_service_progress': 'عرض تقدم الخدمة',

      // STATUS
      'service_status': 'حالة الخدمة',
      'booking': 'الحجز',
      'submitted': 'تم الإرسال',
      'approved': 'تمت الموافقة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'approve_completion': 'اعتماد الإكمال',
      'service_approved': 'تم اعتماد الخدمة',
      'completion_approved': 'تم اعتماد الإكمال',
      'view_checklist_progress': 'عرض تقدم المهام',
      'simulate_next_status': 'محاكاة الحالة التالية',

      // PROFILE
      'profile': 'الملف الشخصي',
      'phone_number': 'رقم الهاتف',
      'location': 'الموقع',
      'role': 'الدور',

      // NOTIFICATIONS
      'notifications': 'الإشعارات',
      'booking_confirmed': 'تم تأكيد الحجز',
      'booking_approved': 'تمت الموافقة على حجز الخدمة',
      'service_assigned': 'تم تعيين الخدمة',
      'technician_assigned_notification': 'تم تعيين فني',
      'service_completed': 'اكتملت الخدمة',
      'review_completed': 'يرجى مراجعة الخدمة المكتملة',

      // PROGRESS
      'service_progress': 'تقدم الخدمة',
      'checklist_completion': 'اكتمال المهام',
      'complete_service': 'إكمال الخدمة',
    },
  };
}