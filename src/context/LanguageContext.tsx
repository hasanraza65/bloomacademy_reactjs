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
  },
  en: {
    // Navbar
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
