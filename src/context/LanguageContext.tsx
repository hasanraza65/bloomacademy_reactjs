import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navbar
    'nav.home': 'Accueil',
    'nav.features': 'Caractéristiques',
    'nav.howItWorks': 'Comment ça marche',
    'nav.testimonials': 'Témoignages',
    'nav.login': 'Connexion',
    'nav.signup': 'S\'inscrire',
    'nav.signupParent': 'Inscription Parent',
    'nav.signupTeacher': 'Inscription Enseignant',
    'nav.parentDesc': 'Pour l\'apprentissage à domicile',
    'nav.teacherDesc': 'Pour les éducateurs',
    'nav.dashboard': 'Tableau de bord',
    'nav.logout': 'Déconnexion',

    // Hero
    'hero.tag': 'Apprentissage moderne pour les futurs leaders',
    'hero.title': 'Apprentissage Amusant & Interactif pour les Enfants',
    'hero.titleLine1': 'Amusant & Interactif',
    'hero.titleLine2': 'Apprentissage pour les Enfants',
    'hero.desc': 'Bloom Buddies Academy combine un programme de classe mondiale avec des expériences ludiques pour faire de l\'apprentissage le moment fort de la journée de votre enfant.',
    'hero.startTrial': 'Essai Gratuit',
    'hero.watchDemo': 'Voir la démo',
    'hero.trusted': 'Approuvé par plus de 5 000 parents heureux',
    'hero.nextClass': 'Prochain cours : La magie des maths',
    'hero.startingIn': 'Commence dans 15 minutes',

    // Features
    'features.title': 'Pourquoi les familles nous aiment',
    'features.desc': 'Nous avons réimaginé l\'éducation en ligne pour qu\'elle soit engageante, efficace et sans effort pour les parents.',
    'feat.interactive.title': 'Cours Interactifs',
    'feat.interactive.desc': 'Engagement en temps réel avec des outils ludiques qui maintiennent les enfants concentrés et enthousiastes.',
    'feat.teachers.title': 'Enseignants Experts',
    'feat.teachers.desc': 'Des éducateurs agréés spécialisés dans la simplification de sujets complexes de manière agréable.',
    'feat.flexible.title': 'Horaires Flexibles',
    'feat.flexible.desc': 'Des cours qui s\'adaptent au style de vie de votre famille. Réservez ou reportez en un clic.',
    'feat.tracking.title': 'Suivi des Progrès',
    'feat.tracking.desc': 'Rapports détaillés et perspectives pour vous aider à célébrer chaque étape franchie par votre enfant.',

    // How It Works
    'how.title': 'Des étapes simples vers le succès',
    'how.desc': 'Rejoindre Bloom Buddies Academy est un jeu d\'enfant. Voici comment commencer dès aujourd\'hui.',
    'step.1.title': 'S\'inscrire',
    'step.1.desc': 'Parlez-nous des intérêts de votre enfant et de votre emploi du temps préféré.',
    'step.2.title': 'Choisir un essai',
    'step.2.desc': 'Choisissez un cours d\'essai gratuit parmi plus de 200 sujets.',
    'step.3.title': 'Commencer à apprendre',
    'step.3.desc': 'Rejoignez le plaisir et regardez la confiance de votre enfant s\'épanouir dans notre classe en direct.',

    // Testimonials
    'test.title': 'Recommandé par des parents comme vous',
    'test.subtitle': 'Rejoignez des milliers de familles qui grandissent déjà avec Bloom.',
    'test.rating': 'Note de 4.9/5',
    'test.independent': 'Avis indépendants',

    // CTA
    'cta.title': 'Réservez un cours d\'essai gratuit',
    'cta.desc': 'Aucune carte de crédit requise. Découvrez pourquoi Bloom Buddies Academy est le premier choix pour les familles innovantes.',
    'cta.button': 'Réclamez votre créneau gratuit',

    // Footer
    'footer.desc': 'Donner aux enfants les moyens d\'atteindre leur plein potentiel grâce à une éducation moderne, amusante et interactive.',
    'footer.newsletter': 'Rejoignez notre newsletter',
    'footer.newsletterDesc': 'Recevez les dernières mises à jour et conseils éducatifs directement dans votre boîte de réception.',
    'footer.rights': '© 2026 Bloom Buddies Academy Inc. Tous droits réservés.',
    'auth.resetPassword': 'Réinitialiser le mot de passe',
    'auth.sendResetLink': 'Envoyer le lien de réinitialisation',
    'auth.checkEmail': 'Vérifiez vos e-mails pour le lien de réinitialisation',
    'auth.invalidLink': 'Lien invalide',
    'auth.invalidLinkDesc': 'Le lien de réinitialisation est invalide ou a expiré.',
    'auth.updatePassword': 'Mettre à jour le mot de passe',
    'auth.passwordUpdated': 'Le mot de passe a été réinitialisé avec succès',
    'auth.backToLogin': 'Retour à la connexion',
    'auth.redirecting': 'Redirection vers la connexion...',
    'auth.forgotDesc': 'Entrez votre e-mail pour recevoir un lien de réinitialisation',
    'auth.errorUnexpected': 'Une erreur inattendue est survenue. Veuillez réessayer.',

    // AuthModal
    'auth.welcome': 'Bienvenue !',
    'auth.loginDesc': 'Connectez-vous à votre tableau de bord pour continuer à apprendre',
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.forgot': 'Mot de passe oublié ?',
    'auth.noAccount': 'Vous n\'avez pas encore de compte ?',
    'auth.loading': 'Chargement...',
    'auth.login': 'Se connecter',
    'auth.parentReg': 'Inscription Parent',
    'auth.teacherReg': 'Inscription Enseignant',
    'auth.teacherOnboarding': 'Intégration des Enseignants',
    'auth.teacherOnboardingDesc': 'Partagez votre expertise avec la prochaine génération',
    'auth.profilePhoto': 'Photo de profil',
    'auth.teacherDob': 'Date de naissance',
    'auth.selectTimezone': 'Sélectionnez le fuseau horaire',
    'auth.aboutMeMin': 'Minimum 250 caractères nécessaires pour instaurer la confiance',
    'auth.teacherStep2': 'Étape 2 : Définissez vos heures d\'enseignement',
    'auth.firstName': 'Prénom',
    'auth.lastName': 'Nom',
    'auth.telephone': 'Téléphone',
    'auth.city': 'Ville',
    'auth.numChildren': 'Nombre d\'enfants',
    'auth.childDob': 'Date de naissance de l\'enfant',
    'auth.learningWindow': 'Fenêtre d\'apprentissage',
    'auth.scheduleDesc': 'Sélectionnez les horaires préférés pour les cours en ligne',
    'auth.addSlot': 'Ajouter créneau',
    'auth.createParent': 'Créer un compte parent',
    'auth.createTeacher': 'Créer un compte enseignant',
    'auth.alreadyAccount': 'Déjà inscrit ?',
    'auth.loginNow': 'Connectez-vous maintenant',
    'auth.timezone': 'Fuseau horaire',
    'auth.aboutMe': 'À propos de moi',
    'auth.aboutMePlaceholder': 'Partagez votre philosophie d\'enseignement...',
    'auth.minChars': 'Minimum 250 caractères nécessaires pour instaurer la confiance',
    'auth.weeklyAvailability': 'Disponibilité hebdomadaire',
    'auth.syncHours': 'Synchronisez vos heures d\'enseignement',
    'auth.clearSelection': 'Effacer la sélection',
    'auth.slotsSelected': 'créneaux sélectionnés',

    // Dashboard
    'dash.welcome': 'Bon retour,',
    'dash.today': 'Voici ce qui se passe aujourd\'hui',
    'dash.classes': 'Cours',
    'dash.joinClass': 'Rejoindre le cours maintenant',
    'dash.currentSession': 'Session actuelle',
    'dash.creativeWriting': 'Écriture Créative Interactive',

    // Days
    'days.Monday': 'Lundi',
    'days.Tuesday': 'Mardi',
    'days.Wednesday': 'Mercredi',
    'days.Thursday': 'Jeudi',
    'days.Friday': 'Vendredi',
    'days.Saturday': 'Samedi',
    'days.Sunday': 'Dimanche',

    // Menage Page
    'nav.menage': 'Ménage',
    'menage.hero.badge': 'SAP 993001130',
    'menage.hero.title': 'Bienvenue à votre domicile propre',
    'menage.hero.subtext': 'Votre partenaire de confiance pour un domicile impeccable et serein',
    'menage.hero.cta': 'Je réserve',
    'menage.services.title': 'Nos services',
    'menage.services.subtitle': 'Nettoyage, repassage, vitres et grand ménage.',
    'menage.service1.title': 'Nettoyage courant',
    'menage.service1.desc': 'Entretien régulier pour garder votre maison impeccable.',
    'menage.service2.title': 'Repassage',
    'menage.service2.desc': 'Finition soignée de votre linge pour un rendu parfait.',
    'menage.service3.title': 'Grand ménage',
    'menage.service3.desc': 'Nettoyage en profondeur, idéal pour le printemps.',
    'menage.testimonials.name1': 'Marie L.',
    'menage.testimonials.quote1': 'Service impeccable, personnel toujours ponctuel et très professionnel.',
    'menage.testimonials.name2': 'Paul D.',
    'menage.testimonials.quote2': 'Grâce à eux, ma maison est toujours impeccable sans stress.',
    'menage.cta.title': 'Réservez maintenant',
    'menage.cta.subtext': 'Planifiez votre ménage en toute simplicité avec Bloom Buddies Academy.',
    'menage.cta.button': 'Je réserve',
    'menage.cta.note': "Avance immédiate de crédit d'impôt disponible",
    'menage.faq.title': 'Questions fréquentes',
    'menage.faq.q1': "Qu'est-ce que l'avance immédiate ?",
    'menage.faq.a1': 'Un service gratuit pour simplifier votre crédit d\'impôt.',
    'menage.faq.q2': "Comment m'inscrire ?",
    'menage.faq.a2': "Nous gérons l'inscription pour vous, simple et rapide.",
    'menage.faq.q3': 'Quels services proposez-vous ?',
    'menage.faq.a3': 'Nous proposons ménage courant, repassage, nettoyage de vitres et grand ménage de printemps.',
    'menage.faq.q4': 'Comment fonctionne le paiement ?',
    'menage.faq.a4': 'Le client active son compte, puis la validation des paiements prend 48h.',
    'menage.faq.q5': "Qui est l'employeur ?",
    'menage.faq.a5': 'Nous sommes l\'employeur, vous bénéficiez d\'un suivi qualité constant.',
    'menage.footer.address': '7 rue Meyerbeer 75009 Paris, France. Lundi–Vendredi, 9h–18h',
    'menage.footer.cities': 'Paris • Lyon • Toulouse • Nice • Nantes • Marseille • Montpellier • Strasbourg • Bordeaux • Lille',
    'menage.footer.copyright': '© Bloom Buddies Academy. Fourni par Enqavon service.',
  },
  en: {

    'hero.titleLine1': 'Fun & Interactive',
    'hero.titleLine2': 'Learning for Kids',

    // Navbar
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.howItWorks': 'How it Works',
    'nav.testimonials': 'Success Stories',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    'nav.signupParent': 'Parent Signup',
    'nav.signupTeacher': 'Teacher Signup',
    'nav.parentDesc': 'For home learning',
    'nav.teacherDesc': 'For educators',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',

    // Menage Page
    'nav.menage': 'Cleaning',
    'menage.hero.badge': 'SAP 993001130',
    'menage.hero.title': 'Welcome to your clean home',
    'menage.hero.subtext': 'Your trusted partner for an impeccable and serene home',
    'menage.hero.cta': 'Book now',
    'menage.services.title': 'Our Services',
    'menage.services.subtitle': 'Cleaning, ironing, windows and deep cleaning.',
    'menage.service1.title': 'Regular Cleaning',
    'menage.service1.desc': 'Regular maintenance to keep your home impeccable.',
    'menage.service2.title': 'Ironing',
    'menage.service2.desc': 'Careful finish of your laundry for a perfect result.',
    'menage.service3.title': 'Deep Cleaning',
    'menage.service3.desc': 'Deep cleaning, ideal for spring.',
    'menage.testimonials.name1': 'Marie L.',
    'menage.testimonials.quote1': 'Impeccable service, always punctual and very professional staff.',
    'menage.testimonials.name2': 'Paul D.',
    'menage.testimonials.quote2': 'Thanks to them, my house is always impeccable without stress.',
    'menage.cta.title': 'Book Now',
    'menage.cta.subtext': 'Plan your cleaning with ease with Bloom Buddies Academy.',
    'menage.cta.button': 'Book now',
    'menage.cta.note': 'Immediate tax credit advance available',
    'menage.faq.title': 'Frequently Asked Questions',
    'menage.faq.q1': 'What is the immediate advance?',
    'menage.faq.a1': 'A free service to simplify your tax credit.',
    'menage.faq.q2': 'How to register?',
    'menage.faq.a2': 'We manage the registration for you, simple and fast.',
    'menage.faq.q3': 'What services do you offer?',
    'menage.faq.a3': 'We offer regular cleaning, ironing, window cleaning and spring deep cleaning.',
    'menage.faq.q4': 'How does payment work?',
    'menage.faq.a4': 'The client activates their account, then payment validation takes 48h.',
    'menage.faq.q5': 'Who is the employer?',
    'menage.faq.a5': 'We are the employer, you benefit from constant quality monitoring.',
    'menage.footer.address': '7 rue Meyerbeer 75009 Paris, France. Monday–Friday, 9am–6pm',
    'menage.footer.cities': 'Paris • Lyon • Toulouse • Nice • Nantes • Marseille • Montpellier • Strasbourg • Bordeaux • Lille',
    'menage.footer.copyright': '© Bloom Buddies Academy. Provided by Enqavon service.',

    // Hero
    'hero.tag': 'Modern Learning for Next-Gen Leaders',
    'hero.title': 'Fun & Interactive Learning for Kids',
    'hero.desc': 'Bloom Buddies Academy combines world-class curriculum with gamified experiences to make learning the highlight of your child\'s day.',
    'hero.startTrial': 'Start Free Trial',
    'hero.watchDemo': 'Watch Class Demo',
    'hero.trusted': 'Trusted by 5,000+ happy parents',
    'hero.nextClass': 'Next Class: Magic of Math',
    'hero.startingIn': 'Starting in 15 minutes',

    // Features
    'features.title': 'Why families love us',
    'features.desc': 'We\'ve reimagined online education from the ground up to be engaging, effective, and effortless for parents.',
    'feat.interactive.title': 'Interactive Classes',
    'feat.interactive.desc': 'Real-time engagement with gamified tools that keep kids focused and excited.',
    'feat.teachers.title': 'Expert Teachers',
    'feat.teachers.desc': 'Vetted educators who specialize in making complex subjects simple and delightful.',
    'feat.flexible.title': 'Flexible Scheduling',
    'feat.flexible.desc': 'Classes that fit your family\'s busy lifestyle. Book or reschedule with one click.',
    'feat.tracking.title': 'Progress Tracking',
    'feat.tracking.desc': 'Detailed reports and insights to help you celebrate every milestone your child hits.',

    // How It Works
    'how.title': 'Simple Steps to Success',
    'how.desc': 'Joining Bloom Buddies Academy is as easy as pie. Here\'s how to get started today.',
    'step.1.title': 'Sign Up',
    'step.1.desc': 'Tell us about your child\'s interests and your preferred schedule.',
    'step.2.title': 'Select Trial',
    'step.2.desc': 'Pick a free trial class that fits your schedule from our 200+ topics.',
    'step.3.title': 'Start Learning',
    'step.3.desc': 'Join the fun and watch your child\'s confidence bloom in our live classroom.',

    // Testimonials
    'test.title': 'Recommended by parents like you',
    'test.subtitle': 'Join thousands of families already growing with Bloom.',
    'test.rating': '4.9/5 Rating',
    'test.independent': 'Independent Reviews',

    // CTA
    'cta.title': 'Book a Free Trial Class',
    'cta.desc': 'No credit card required. Experience why Bloom Buddies Academy is the top choice for innovative families.',
    'cta.button': 'Claim Your Free Slot',

    // Footer
    'footer.desc': 'Empowering children to reach their full potential through modern, fun, and interactive education.',
    'footer.newsletter': 'Join our newsletter',
    'footer.newsletterDesc': 'Get the latest updates and educational tips directly in your inbox.',
    'footer.rights': '© 2026 Bloom Buddies Academy Inc. All rights reserved.',
    'auth.resetPassword': 'Reset Password',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.checkEmail': 'Check your email for reset link',
    'auth.invalidLink': 'Invalid Link',
    'auth.invalidLinkDesc': 'The reset password link is invalid or has expired.',
    'auth.updatePassword': 'Update Password',
    'auth.passwordUpdated': 'Password has been reset successfully',
    'auth.backToLogin': 'Back to Login',
    'auth.redirecting': 'Redirecting to login...',
    'auth.forgotDesc': 'Enter your email to receive a password reset link',
    'auth.errorUnexpected': 'An unexpected error occurred. Please try again.',

    // AuthModal
    'auth.welcome': 'Welcome back!',
    'auth.loginDesc': 'Log in to your dashboard to continue learning',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgot': 'Forgot password?',
    'auth.noAccount': 'Don\'t have an account yet?',
    'auth.loading': 'Loading...',
    'auth.login': 'Log In',
    'auth.parentReg': 'Parent Registration',
    'auth.teacherReg': 'Teacher Onboarding',
    'auth.teacherOnboarding': 'Teacher Onboarding',
    'auth.teacherOnboardingDesc': 'Share your expertise with the next generation',
    'auth.profilePhoto': 'Profile Photo',
    'auth.teacherDob': 'Date of Birth',
    'auth.selectTimezone': 'Select Timezone',
    'auth.aboutMeMin': 'Minimum 250 characters needed to build trust',
    'auth.teacherStep2': 'Step 2: Define your teaching hours',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.telephone': 'Telephone',
    'auth.city': 'City',
    'auth.numChildren': 'Number of Children',
    'auth.childDob': 'Child Date of Birth',
    'auth.learningWindow': 'Learning Window',
    'auth.scheduleDesc': 'Select preferred time windows for online classes',
    'auth.addSlot': 'Add Slot',
    'auth.createParent': 'Create Parent Account',
    'auth.createTeacher': 'Create Teacher Account',
    'auth.alreadyAccount': 'Already signed up?',
    'auth.loginNow': 'Login now',
    'auth.timezone': 'Timezone',
    'auth.aboutMe': 'About Me',
    'auth.aboutMePlaceholder': 'Share your teaching philosophy...',
    'auth.minChars': 'Minimum 250 characters needed to build trust',
    'auth.weeklyAvailability': 'Weekly Availability',
    'auth.syncHours': 'Sync your teaching hours',
    'auth.clearSelection': 'Clear Selection',
    'auth.slotsSelected': 'slots selected',

    // Dashboard
    'dash.welcome': 'Welcome back,',
    'dash.today': 'Here\'s what\'s happening today',
    'dash.classes': 'Classes',
    'dash.joinClass': 'Join Live Class Now',
    'dash.currentSession': 'Current Session',
    'dash.creativeWriting': 'Interactive Creative Writing',

    // Days
    'days.Monday': 'Monday',
    'days.Tuesday': 'Tuesday',
    'days.Wednesday': 'Wednesday',
    'days.Thursday': 'Thursday',
    'days.Friday': 'Friday',
    'days.Saturday': 'Saturday',
    'days.Sunday': 'Sunday',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
