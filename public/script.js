let currentClass = null; 
let savedData = {};
let currentIsBoysSection = false;
let currentUserId = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : (Date.now()+"-"+Math.random())).toString();
let sse; let presenceKey = null; let presenceTimer = null;

// AUTO-SAVE DÉSACTIVÉ - Enregistrement manuel uniquement
// Variable pour tracker si des modifications ont été faites
let hasUnsavedChanges = false;

const standardHeaders = ["Mois", "Semaine", "Date", "Jour", "Unité/Chapitre", "Contenu de la leçon", "Ressources pour les leçons", "Devoir", "Ressources pour les devoirs", "Recherche", "Projets"];
const monthAbbreviations = { 'Janvier': 'Janv.', 'Février': 'Févr.', 'Mars': 'Mars', 'Avril': 'Avr.', 'Mai': 'Mai', 'Juin': 'Juin', 'Juillet': 'Juil.', 'Août': 'Août', 'Septembre': 'Sept.', 'Octobre': 'Oct.', 'Novembre': 'Nov.', 'Décembre': 'Déc.' }; 
const classSubjects = {'TPS':['Français','Maths','Sciences','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'PS':['Français','Maths','Sciences','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'MS':['Français','Maths','Sciences','Informatique','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'GS':['Français','Maths','Sciences','Informatique','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'PP1':['Français','Maths','Anglais','French second language','Informatique','Sciences Naturelles','Sciences Humaines','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'PP2':['Français','Maths','Anglais','French second language','Informatique','Sciences Naturelles','Sciences Humaines','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'PP3':['Français','Maths','Anglais','French second language','Informatique','Sciences Naturelles','Sciences Humaines','ART','Éducation physique','Montessori','Musique','Bibliothèque'],'PP4':['Français','Maths','Anglais','French second language','Informatique','Sciences humaines','Sciences naturelles','ART','Éducation physique','Musique','Bibliothèque'],'PP5':['Français','Maths','Anglais','French second language','Informatique','Sciences Naturelles','Sciences Humaines','ART','Éducation physique','Musique','Bibliothèque'],'PEI1':['Langue et littérature','Maths','Sciences','Anglais','Design','Individus et Sociétés','Éducation physique','Musique','Bibliothèque','ART'],'PEI2':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','Design','Individus et Sociétés','Éducation physique','Musique','Bibliothèque','ART'],'PEI3':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','Design','Individus et Sociétés','Éducation physique','Musique','Bibliothèque','ART'],'PEI4':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','Design','Individus et Sociétés','Éducation physique','Musique','Bibliothèque','ART'],'PEI5':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','SNT','SES','Individus et Sociétés','Éducation physique','Musique','Bibliothèque'],'DP1':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','SES','Individus et Sociétés','Enseignement Scientifique','Éducation physique','Bibliothèque','ART'],'DP2':['Langue et littérature','Maths','Biologie','Physique-chimie','Anglais','SES','Individus et Sociétés','Enseignement Scientifique','Éducation physique','Bibliothèque','ART']};
const classSessionCounts = {"MS":{"Français":8,"Maths":5,"Sciences":4,"Éducation physique":2,"Montessori":2,"Musique":1,"ART":1,"Bibliothèque":1},"GS":{"Français":10,"Maths":5,"Sciences":5,"Éducation physique":2,"Informatique":2,"Montessori":2,"Musique":1,"ART":1,"Bibliothèque":1},"PP1":{"Français":8,"Maths":5,"Anglais":3,"Sciences Humaines":3,"Sciences Naturelles":3,"Éducation physique":2,"Montessori":1,"ART":1,"Informatique":1,"Musique":1,"Bibliothèque":1},"PP2":{"Français":8,"Maths":5,"Anglais":3,"Sciences Humaines":3,"Sciences Naturelles":3,"Éducation physique":2,"Montessori":1,"ART":1,"Informatique":1,"Musique":1,"Bibliothèque":1},"PP3":{"Français":8,"Maths":5,"Anglais":3,"Sciences Humaines":3,"Sciences Naturelles":3,"Éducation physique":2,"Montessori":1,"ART":1,"Informatique":1,"Musique":1,"Bibliothèque":1},"PP4":{"Français":9,"Maths":5,"Anglais":3,"Sciences Naturelles":3,"Sciences Humaines":3,"Éducation physique":2,"Informatique":1,"Musique":1,"ART":1,"Bibliothèque":1},"PP5":{"Français":9,"Maths":5,"Anglais":3,"Sciences Naturelles":3,"Sciences Humaines":3,"Éducation physique":2,"Informatique":1,"Musique":1,"ART":1,"Bibliothèque":1},"PEI1":{"Langue et littérature":6,"Maths":5,"Sciences":5,"Anglais":3,"Design":2,"Individus et Sociétés":3,"Éducation physique":1,"Musique":1,"Bibliothèque":1,"ART":1},"PEI2":{"Langue et littérature":5,"Maths":5,"Biologie":3,"Physique-chimie":3,"Anglais":3,"Design":3,"Individus et Sociétés":3,"Éducation physique":1,"Musique":1,"Bibliothèque":1,"ART":1},"PEI3":{"Langue et littérature":5,"Maths":5,"Biologie":3,"Physique-chimie":3,"Anglais":3,"Design":3,"Individus et Sociétés":3,"Éducation physique":1,"Musique":1,"Bibliothèque":1,"ART":1},"PEI4":{"Langue et littérature":5,"Maths":5,"Biologie":4,"Physique-chimie":4,"Anglais":3,"Design":3,"Individus et Sociétés":3,"Éducation physique":1,"Musique":1,"Bibliothèque":1,"ART":1},"PEI5":{"Langue et littérature":5,"Maths":6,"Biologie":4,"Physique-chimie":4,"Anglais":3,"SNT":1,"SES":2,"Individus et Sociétés":4,"Éducation physique":1,"Musique":1,"Bibliothèque":1},"DP1":{"Langue et littérature":4,"Maths":6,"Biologie":4,"Physique-chimie":4,"Anglais":3,"SES":1,"Individus et Sociétés":4,"Enseignement Scientifique":3,"Éducation physique":1,"Bibliothèque":1,"ART":1},"DP2":{"Langue et littérature":4,"Maths":6,"Biologie":4,"Physique-chimie":4,"Anglais":3,"SES":1,"Individus et Sociétés":4,"Enseignement Scientifique":3,"Éducation physique":1,"Bibliothèque":1,"ART":1}};
// Academic Calendar 2025-2026: STRICT per user specification
// 31 teaching weeks (Semaines 1-31) + exams + vacations
// No long weekends anywhere in the year (removed)
const academicCalendar = [
  { "month": "Août", "week": "Semaine 1", "date": "31/08/2025", "day": "Dimanche", "type": "Orientation" },
  { "month": "Septembre", "week": "Semaine 1", "date": "01/09/2025", "day": "Lundi", "type": "Orientation" },
  { "month": "Septembre", "week": "Semaine 1", "date": "02/09/2025", "day": "Mardi", "type": "Orientation" },
  { "month": "Septembre", "week": "Semaine 1", "date": "03/09/2025", "day": "Mercredi", "type": "Orientation" },
  { "month": "Septembre", "week": "Semaine 1", "date": "04/09/2025", "day": "Jeudi", "type": "Orientation" },
  { "month": "Septembre", "week": "Semaine 2", "date": "07/09/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 2", "date": "08/09/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 2", "date": "09/09/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 2", "date": "10/09/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 2", "date": "11/09/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 3", "date": "14/09/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 3", "date": "15/09/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 3", "date": "16/09/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 3", "date": "17/09/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 3", "date": "18/09/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 4", "date": "21/09/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 4", "date": "22/09/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 4", "date": "23/09/2025", "day": "Mardi", "type": "Saudi National day" },
  { "month": "Septembre", "week": "Semaine 4", "date": "24/09/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 4", "date": "25/09/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 5", "date": "28/09/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 5", "date": "29/09/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Septembre", "week": "Semaine 5", "date": "30/09/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 5", "date": "01/10/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 5", "date": "02/10/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 6", "date": "05/10/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 6", "date": "06/10/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 6", "date": "07/10/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 6", "date": "08/10/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 6", "date": "09/10/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 7", "date": "12/10/2025", "day": "Dimanche", "type": "evaluation" },
  { "month": "Octobre", "week": "Semaine 7", "date": "13/10/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 7", "date": "14/10/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 7", "date": "15/10/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 7", "date": "16/10/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 8", "date": "19/10/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 8", "date": "20/10/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 8", "date": "21/10/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 8", "date": "22/10/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 8", "date": "23/10/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 9", "date": "26/10/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 9", "date": "27/10/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 9", "date": "28/10/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 9", "date": "29/10/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Octobre", "week": "Semaine 9", "date": "30/10/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 10", "date": "02/11/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 10", "date": "03/11/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 10", "date": "04/11/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 10", "date": "05/11/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 10", "date": "06/11/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 11", "date": "09/11/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 11", "date": "10/11/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 11", "date": "11/11/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 11", "date": "12/11/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 11", "date": "13/11/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 12", "date": "16/11/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 12", "date": "17/11/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 12", "date": "18/11/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 12", "date": "19/11/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 12", "date": "20/11/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 13", "date": "23/11/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 13", "date": "24/11/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 13", "date": "25/11/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 13", "date": "26/11/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 13", "date": "27/11/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Novembre", "week": "Semaine 14", "date": "30/11/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 14", "date": "01/12/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 14", "date": "02/12/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 14", "date": "03/12/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 14", "date": "04/12/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 15", "date": "07/12/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 15", "date": "08/12/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 15", "date": "09/12/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 15", "date": "10/12/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 15", "date": "11/12/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 16", "date": "14/12/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 16", "date": "15/12/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 16", "date": "16/12/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 16", "date": "17/12/2025", "day": "Mercredi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 16", "date": "18/12/2025", "day": "Jeudi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 17", "date": "21/12/2025", "day": "Dimanche", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 17", "date": "22/12/2025", "day": "Lundi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 17", "date": "23/12/2025", "day": "Mardi", "type": "Cours" },
  { "month": "Décembre", "week": "Semaine 17", "date": "24/12/2025", "day": "Mercredi", "type": "examen" },
  { "month": "Décembre", "week": "Semaine 17", "date": "25/12/2025", "day": "Jeudi", "type": "examen" },
  { "month": "Décembre", "week": "examen", "date": "28/12/2025", "day": "Dimanche", "type": "examen" },
  { "month": "Décembre", "week": "examen", "date": "29/12/2025", "day": "Lundi", "type": "examen" },
  { "month": "Décembre", "week": "examen", "date": "30/12/2025", "day": "Mardi", "type": "examen" },
  { "month": "Décembre", "week": "examen", "date": "31/12/2025", "day": "Mercredi", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "01/01/2026", "day": "Jeudi", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "04/01/2026", "day": "Dimanche", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "05/01/2026", "day": "Lundi", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "06/01/2026", "day": "Mardi", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "07/01/2026", "day": "Mercredi", "type": "examen" },
  { "month": "Janvier", "week": "examen", "date": "08/01/2026", "day": "Jeudi", "type": "examen" },
  { "month": "Janvier", "week": "Vacance", "date": "11/01/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Janvier", "week": "Vacance", "date": "12/01/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Janvier", "week": "Vacance", "date": "13/01/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Janvier", "week": "Vacance", "date": "14/01/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Janvier", "week": "Vacance", "date": "15/01/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Janvier", "week": "Semaine 18", "date": "18/01/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 18", "date": "19/01/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 18", "date": "20/01/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 18", "date": "21/01/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 18", "date": "22/01/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 19", "date": "25/01/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 19", "date": "26/01/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 19", "date": "27/01/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 19", "date": "28/01/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Janvier", "week": "Semaine 19", "date": "29/01/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 20", "date": "01/02/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Février", "week": "Semaine 20", "date": "02/02/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 20", "date": "03/02/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 20", "date": "04/02/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 20", "date": "05/02/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 21", "date": "08/02/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Février", "week": "Semaine 21", "date": "09/02/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 21", "date": "10/02/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 21", "date": "11/02/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 21", "date": "12/02/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 22", "date": "15/02/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Février", "week": "Semaine 22", "date": "16/02/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 22", "date": "17/02/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 22", "date": "18/02/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 22", "date": "19/02/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 23", "date": "22/02/2026", "day": "Dimanche", "type": "Saudi Fondation Day" },
  { "month": "Février", "week": "Semaine 23", "date": "23/02/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 23", "date": "24/02/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 23", "date": "25/02/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Février", "week": "Semaine 23", "date": "26/02/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 24", "date": "01/03/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 24", "date": "02/03/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 24", "date": "03/03/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 24", "date": "04/03/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 24", "date": "05/03/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Mars", "week": "Vacance", "date": "08/03/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "09/03/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "10/03/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "11/03/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "12/03/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "15/03/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "16/03/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "17/03/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "18/03/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "19/03/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "22/03/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "23/03/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "24/03/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "25/03/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Mars", "week": "Vacance", "date": "26/03/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Mars", "week": "Semaine 25", "date": "29/03/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 25", "date": "30/03/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Mars", "week": "Semaine 25", "date": "31/03/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 25", "date": "01/04/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 25", "date": "02/04/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 26", "date": "05/04/2026", "day": "Dimanche", "type": "evaluation" },
  { "month": "Avril", "week": "Semaine 26", "date": "06/04/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 26", "date": "07/04/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 26", "date": "08/04/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 26", "date": "09/04/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 27", "date": "12/04/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 27", "date": "13/04/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 27", "date": "14/04/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 27", "date": "15/04/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 27", "date": "16/04/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 28", "date": "19/04/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 28", "date": "20/04/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 28", "date": "21/04/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 28", "date": "22/04/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 28", "date": "23/04/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 29", "date": "26/04/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 29", "date": "27/04/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 29", "date": "28/04/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 29", "date": "29/04/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Avril", "week": "Semaine 29", "date": "30/04/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 30", "date": "03/05/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 30", "date": "04/05/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 30", "date": "05/05/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 30", "date": "06/05/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 30", "date": "07/05/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 31", "date": "10/05/2026", "day": "Dimanche", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 31", "date": "11/05/2026", "day": "Lundi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 31", "date": "12/05/2026", "day": "Mardi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 31", "date": "13/05/2026", "day": "Mercredi", "type": "Cours" },
  { "month": "Mai", "week": "Semaine 31", "date": "14/05/2026", "day": "Jeudi", "type": "Cours" },
  { "month": "Mai", "week": "Vacance", "date": "17/05/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "18/05/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "19/05/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "20/05/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "21/05/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "24/05/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "25/05/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "26/05/2026", "day": "Mardi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "27/05/2026", "day": "Mercredi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "28/05/2026", "day": "Jeudi", "type": "Vacance" },
  { "month": "Mai", "week": "Vacance", "date": "31/05/2026", "day": "Dimanche", "type": "Vacance" },
  { "month": "Juin", "week": "Vacance", "date": "01/06/2026", "day": "Lundi", "type": "Vacance" },
  { "month": "Juin", "week": "examen", "date": "02/06/2026", "day": "Mardi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "03/06/2026", "day": "Mercredi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "04/06/2026", "day": "Jeudi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "07/06/2026", "day": "Dimanche", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "08/06/2026", "day": "Lundi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "09/06/2026", "day": "Mardi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "10/06/2026", "day": "Mercredi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "11/06/2026", "day": "Jeudi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "14/06/2026", "day": "Dimanche", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "15/06/2026", "day": "Lundi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "16/06/2026", "day": "Mardi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "17/06/2026", "day": "Mercredi", "type": "examen" },
  { "month": "Juin", "week": "examen", "date": "18/06/2026", "day": "Jeudi", "type": "examen" }
];

const isPlannable = (event) => event && event.type === 'Cours';
// Updated to match user specification: Orientation, Evaluation, Long weekend, Saudi National day, Examen Final 1/2, Vacances, Saudi foundation day
const isSpecialDay = (event) => {
  if (!event) return false;
  const type = event.type.toLowerCase();
  // Strict special days only (no long weekend)
  return type.includes('orientation') ||
         type.includes('evaluation') ||
         type.includes('saudi') ||
         type.includes('examen') ||
         type.includes('vacance') ||
         type.includes('day');
};

/**
 * Obtenir la classe de base (sans suffixe -G pour les classes Garçons)
 * Exemple: PEI1-G → PEI1, DP2-G → DP2, PEI3 → PEI3
 */
const getBaseClassName = (className) => {
  return className ? className.replace('-G', '') : className;
};

function showErrorMessage(message, duration = 5000) { 
  let errorDiv = document.getElementById('errorMessage'); 
  if (!errorDiv) { 
    errorDiv = document.createElement('div'); 
    errorDiv.id = 'errorMessage'; 
    errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background-color: #fde8e8; color: #7f1d1d; padding: 15px; border: 1px solid #fecaca; border-radius: 5px; max-width: 500px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 14px; white-space: pre-wrap;`; 
    document.body.appendChild(errorDiv); 
  } 
  errorDiv.innerHTML = message.replace(/\n/g, '<br>'); 
  errorDiv.style.display = 'block'; 
  setTimeout(() => { 
    if (errorDiv) errorDiv.style.display = 'none'; 
  }, duration); 
}

function showSuccessMessage(message, duration = 3000) { 
  let successDiv = document.getElementById('successMessage'); 
  if (!successDiv) { 
    successDiv = document.createElement('div'); 
    successDiv.id = 'successMessage'; 
    successDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background-color: #ecfdf5; color: #064e3b; padding: 15px; border: 1px solid #bbf7d0; border-radius: 5px; max-width: 500px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 14px;`; 
    document.body.appendChild(successDiv); 
  } 
  successDiv.textContent = message; 
  successDiv.style.display = 'block'; 
  setTimeout(() => { 
    if (successDiv) successDiv.style.display = 'none'; 
  }, duration); 
}

/**
 * Afficher une barre de progression avec pourcentage
 */
function showProgressWithPercentage(message, percentage) {
  let progressDiv = document.getElementById('progressBarDownload');
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'progressBarDownload';
    progressDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10001; min-width: 400px; text-align: center;`;
    document.body.appendChild(progressDiv);
  }
  
  const percentNum = Math.min(100, Math.max(0, percentage));
  
  progressDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <i class="ri-download-cloud-line" style="font-size: 3em; color: #10b981;"></i>
    </div>
    <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">
      ${message}
    </div>
    <div style="background: #e5e7eb; border-radius: 10px; height: 30px; overflow: hidden; position: relative;">
      <div style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); height: 100%; width: ${percentNum}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: bold; font-size: 14px; position: absolute; left: 50%; transform: translateX(-50%);">${percentNum}%</span>
      </div>
    </div>
    <div style="margin-top: 15px; color: #6b7280; font-size: 14px;">
      Veuillez patienter...
    </div>
  `;
  progressDiv.style.display = 'block';
}

/**
 * Cacher la barre de progression
 */
function hideProgressWithPercentage() {
  const progressDiv = document.getElementById('progressBarDownload');
  if (progressDiv) {
    progressDiv.style.display = 'none';
  }
}

async function apiCall(endpoint, payload) { try { const response = await fetch(`/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), }); if (!response.ok) { let errorMessage = `Erreur du serveur: ${response.status}`; try { const errorData = await response.json(); errorMessage = errorData.error || errorMessage; } catch (parseError) { errorMessage = response.statusText || errorMessage; } throw new Error(errorMessage); } if (endpoint === 'generatePdfOnServer') { return response.blob(); } return response.json(); } catch (error) { console.error(`Erreur API pour ${endpoint}:`, error); showErrorMessage(`Erreur: ${error.message}`); throw error; } }

function initSSE() { 
  if (sse) return; 
  try { 
    sse = new EventSource('/api/events'); 
    
    sse.addEventListener('ping', (ev) => {
      console.log('SSE ping received');
    });
    
    sse.addEventListener('refresh', (ev) => { 
      try { 
        const data = JSON.parse(ev.data || '{}'); 
        if (!currentClass) return; 
        // Ne pas rafraîchir automatiquement - montrer juste une notification 
        showSuccessMessage("Des modifications ont été effectuées par un autre utilisateur.", 3000); 
      } catch(_) {} 
    }); 
    
    sse.addEventListener('presence', (ev) => { 
      try { 
        const data = JSON.parse(ev.data || '{}'); 
        if (data && presenceKey && data.key === presenceKey) { 
          const bar = document.getElementById('presenceBar'); 
          if (bar) { 
            const others = Math.max(0, (data.count || 0)); 
            bar.textContent = others > 1 ? `${others} utilisateurs dans cette matière` : (others === 1 ? `1 utilisateur dans cette matière` : ''); 
            bar.style.display = others > 0 ? 'block' : 'none'; 
          } 
        } 
      } catch(_) {} 
    });
    
    // Reconnecter automatiquement en cas d'erreur
    sse.addEventListener('error', (e) => {
      console.warn('SSE error, will reconnect...', e);
      sse.close();
      sse = null;
      // Reconnecter après 5 secondes
      setTimeout(() => {
        if (currentClass) {
          initSSE();
        }
      }, 5000);
    });
    
  } catch (e) {
    console.error('SSE initialization error:', e);
  } 
}

async function goToClass(className, isBoysSection = false) { 
  currentClass = className; 
  currentIsBoysSection = isBoysSection;
  
  document.getElementById('initialSelection').style.display = 'none'; 
  document.getElementById('classView').style.display = 'block'; 
  initSSE(); 
  
  // Afficher le badge "Garçons" si c'est la section garçons
  const badge = isBoysSection ? ' <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 5px 15px; border-radius: 20px; font-size: 0.7em; color: white;"><i class="ri-robot-line"></i> Garçons (IA)</span>' : '';
  document.getElementById('classTitle').innerHTML = `Classe ${className.replace('-G', '')}${badge}`;
  
  // Afficher le BOUTON IA pour la section garçons (le formulaire reste caché)
  const aiButtonContainer = document.getElementById('aiButtonContainer');
  const aiSection = document.getElementById('aiDistributionSection');
  
  if (aiButtonContainer) {
    aiButtonContainer.style.display = isBoysSection ? 'block' : 'none';
  }
  
  // Le formulaire IA reste toujours caché au départ
  if (aiSection) {
    aiSection.style.display = 'none';
  }
  
  savedData = {}; 
  document.getElementById('matiereSelect').innerHTML = "<option value=''>Sélectionner une matière</option>"; 
  document.getElementById('output').innerHTML = ""; 
  document.getElementById('filterBy').value = ""; 
  document.getElementById('filterOptions').style.display = 'none'; 
  document.getElementById('showFilledOnly').checked = false; 
  
  if (!className) return; 
  
  showProgressBar(); 
  try { 
    const [tableResponse, allSelectionsResponse] = await Promise.all([ 
      apiCall('loadLatestCopy', { className }), 
      apiCall('loadAllSelectionsForClass', { className }) 
    ]); 
    
    if (tableResponse.success && Array.isArray(tableResponse.tables)) { 
      tableResponse.tables.forEach(({ matiere, data }) => { 
        savedData[matiere] = data; 
      }); 
    } 
    
    populateMatiereSelect(className); 
    
    // Utiliser les matières basées sur la classe de base (sans -G)
    const baseClass = className.replace('-G', '');
    const subjects = classSubjects[baseClass] || []; 
    
    subjects.forEach(subject => { 
      if (!savedData[subject] || savedData[subject].length <= 1) { 
        savedData[subject] = generateInitialData(); 
      } 
    }); 
    
    if (subjects.length > 0) { 
      document.getElementById('matiereSelect').value = subjects[0]; 
      displaySelectedTable(); 
    } 
  } catch (error) { 
    console.error("Erreur lors du chargement de la classe:", error); 
    showErrorMessage("Erreur de chargement de la classe: " + error.message); 
  } finally { 
    hideProgressBar(); 
  } 
}

async function resetCurrentMatiere() { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere) { alert("Veuillez sélectionner une classe et une matière."); return; } if (!confirm(`Êtes-vous sûr de vouloir réinitialiser "${selectedMatiere}" avec le calendrier 2025-2026?\n\nToutes les données existantes seront remplacées par le nouveau calendrier.`)) { return; } showProgressBar(); try { savedData[selectedMatiere] = generateInitialData(); const ack = await apiCall('saveTable', { className: currentClass, sheetName: selectedMatiere, data: savedData[selectedMatiere] }); if (ack.success) { showSuccessMessage(`"${selectedMatiere}" a été réinitialisée avec le calendrier 2025-2026 (31 semaines)!`); displaySelectedTable(); } } catch (error) { showErrorMessage("Erreur lors de la réinitialisation: " + error.message); } finally { hideProgressBar(); } }

async function heartbeatPresence() { try { if (!presenceKey) return; await apiCall('presence/heartbeat', { className: presenceKey.split(':')[0], sheetName: presenceKey.split(':')[1], userId: currentUserId }); } catch (_) {} }

async function saveTable(isSilent = false, createBackup = false) { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere || !savedData[selectedMatiere]) { if (!isSilent) alert("Veuillez sélectionner une classe et une matière."); return; } if (savedData[selectedMatiere].length <= 1) { if (!isSilent) alert("Aucune donnée à enregistrer."); return; } if (!isSilent) showProgressBar(); try { const ack = await apiCall('saveTable', { className: currentClass, sheetName: selectedMatiere, data: savedData[selectedMatiere], createBackup: createBackup }); if (ack.success) { hideUnsavedIndicator(); if (!isSilent) showSuccessMessage("Modifications enregistrées avec succès!"); } } catch (error) { if (!isSilent) showErrorMessage("Erreur lors de l'enregistrement: " + error.message); } finally { if (!isSilent) hideProgressBar(); } }

async function deleteMatiereData() { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere) { alert("Veuillez sélectionner une classe et une matière à supprimer."); return; } if (confirm(`Êtes-vous sûr de vouloir supprimer TOUTES les données pour la matière "${selectedMatiere}" dans la classe ${currentClass} ?\nCette action est irréversible.`)) { showProgressBar(); try { const ack = await apiCall('deleteMatiereData', { className: currentClass, sheetName: selectedMatiere }); if (ack.success) { alert(`Les données pour la matière "${selectedMatiere}" ont été supprimées.`); savedData[selectedMatiere] = generateInitialData(); displaySelectedTable(); } } catch (error) { alert("Erreur lors de la suppression des données : " + error.message); } finally { hideProgressBar(); } } }

async function generatePdf() { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere) { alert("Veuillez sélectionner une classe et une matière."); return; } showProgressBar(); try { const response = await fetch('https://docs.google.com/document/d/1FLux_zEr90hvMRRODtex0c7d5tHTtFS1/export?format=docx'); if (!response.ok) throw new Error("Le modèle Word n'a pas pu être chargé."); const template = await response.arrayBuffer(); const zip = new PizZip(template); const doc = new docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" }); const templateData = prepareWordDataForSubject(selectedMatiere, savedData[selectedMatiere], currentClass); doc.render(templateData); const docxBuffer = doc.getZip().generate({ type: 'uint8array' }); const base64String = btoa(String.fromCharCode.apply(null, docxBuffer)); const pdfBlob = await apiCall('generatePdfOnServer', { docxBuffer: base64String, fileName: `${currentClass}_${selectedMatiere}_Distribution.docx` }); saveAs(pdfBlob, `${currentClass}_${selectedMatiere}_Distribution.pdf`); } catch (error) { console.error('Erreur lors de la génération du PDF:', error); alert('Une erreur est survenue lors de la génération du PDF: ' + error.message); } finally { hideProgressBar(); } }

async function generateWord() { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere) { alert("Veuillez sélectionner une classe et une matière."); return; } showProgressBar(); try { const response = await fetch('https://docs.google.com/document/d/1uFWwBSy4RuF6d5zpy_2nOa43Q4ITm3Bs/export?format=docx'); if (!response.ok) throw new Error("Le modèle Word n'a pas pu être chargé."); const template = await response.arrayBuffer(); const zip = new PizZip(template); const doc = new docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" }); const templateData = prepareWordDataForSubject(selectedMatiere, savedData[selectedMatiere], currentClass); doc.render(templateData); const docxBlob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); saveAs(docxBlob, `${currentClass}_${selectedMatiere}_Distribution.docx`); showSuccessMessage("Document Word généré avec succès!"); } catch (error) { console.error('Erreur lors de la génération du document Word:', error); showErrorMessage('Une erreur est survenue lors de la génération du document Word: ' + error.message); } finally { hideProgressBar(); } }

async function generateWordZipForClass() { if (!currentClass) { alert("Veuillez d'abord sélectionner une classe."); return; } if (Object.keys(savedData).length === 0) { alert("Les données de la classe ne sont pas encore chargées. Veuillez patienter ou recharger."); return; } showProgressBar(); try { const response = await fetch('https://docs.google.com/document/d/1uFWwBSy4RuF6d5zpy_2nOa43Q4ITm3Bs/export?format=docx'); if (!response.ok) throw new Error("Le modèle Word n'a pas pu être chargé."); const template = await response.arrayBuffer(); const zip = new JSZip(); const subjects = classSubjects[currentClass]; if (!subjects || subjects.length === 0) { throw new Error("Aucune matière n'est définie pour cette classe."); } for (const subject of subjects) { if (savedData[subject] && savedData[subject].length > 1) { try { const templateZip = new PizZip(template); const doc = new docxtemplater(templateZip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" }); const templateData = prepareWordDataForSubject(subject, savedData[subject], currentClass); doc.render(templateData); const docxBuffer = doc.getZip().generate({ type: 'uint8array' }); zip.file(`${currentClass}_${subject}_Distribution.docx`, docxBuffer); } catch (docError) { console.warn(`Erreur lors de la génération du document pour ${subject}:`, docError); } } } if (Object.keys(zip.files).length > 0) { const content = await zip.generateAsync({ type: "blob" }); saveAs(content, `Distribution_Word_${currentClass}.zip`); showSuccessMessage("Archive ZIP des documents Word générée avec succès!"); } else { alert("Aucun document Word n'a pu être généré. Vérifiez que les matières contiennent des données."); } } catch (error) { console.error('Erreur lors de la génération du ZIP de fichiers Word:', error); showErrorMessage('Une erreur est survenue : ' + error.message); } finally { hideProgressBar(); } }

function generateInitialData(calendar = academicCalendar) { 
  // ALWAYS use the full academicCalendar (210 entries) to ensure consistency
  const data = [standardHeaders]; 
  academicCalendar.forEach(event => { 
    const weekLabel = event.week; 
    const newRow = Array(standardHeaders.length).fill(''); 
    newRow[0] = event.month; 
    newRow[1] = weekLabel; 
    newRow[2] = event.date; 
    newRow[3] = event.day; 
    newRow[4] = event.type || 'Cours Normal'; 
    data.push(newRow); 
  }); 
  return data; 
}

function showClasses(section) { document.querySelectorAll('.section-classes').forEach(div => { div.style.display = 'none'; }); document.getElementById(section).style.display = 'block'; }
function showInitialSelection() { document.getElementById('classView').style.display = 'none'; document.getElementById('initialSelection').style.display = 'block'; currentClass = null; savedData = {}; document.getElementById('matiereSelect').innerHTML = "<option value=''>Sélectionner une matière</option>"; document.getElementById('output').innerHTML = ""; document.getElementById('filterBy').value = ""; document.getElementById('filterOptions').innerHTML = ""; document.getElementById('filterOptions').style.display = 'none'; document.getElementById('showFilledOnly').checked = false; }

function populateMatiereSelect(className) { 
  const select = document.getElementById('matiereSelect'); 
  select.innerHTML = "<option value=''>Sélectionner une matière</option>"; 
  
  // Utiliser la classe de base (sans -G) pour obtenir les matières
  const baseClass = className.replace('-G', '');
  const subjects = classSubjects[baseClass]; 
  
  if (subjects) { 
    subjects.forEach(subject => { 
      const option = document.createElement('option'); 
      option.value = subject; 
      option.textContent = subject; 
      select.appendChild(option); 
    }); 
  } 
}

function displaySelectedTable() { const selectedMatiere = document.getElementById('matiereSelect').value; presenceKey = currentClass && selectedMatiere ? `${currentClass}:${selectedMatiere}` : null; if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; } if (presenceKey) { initSSE(); heartbeatPresence(); presenceTimer = setInterval(heartbeatPresence, 10000); }
  
  // Afficher l'indicateur d'enregistrement automatique
  const autoSaveIndicator = document.getElementById('autoSaveIndicator');
  if (autoSaveIndicator) {
    autoSaveIndicator.style.display = selectedMatiere ? 'inline' : 'none';
  }
  
  if (selectedMatiere && currentClass) { if (!savedData[selectedMatiere] || savedData[selectedMatiere].length <= 1) { savedData[selectedMatiere] = generateInitialData(); }
    if (typeof needsNormalization === 'function' && needsNormalization(selectedMatiere)) { normalizeSavedDataForSubject(selectedMatiere); saveTable(true); }
    renderTable(selectedMatiere, savedData[selectedMatiere]); } else { document.getElementById('output').innerHTML = ""; if (autoSaveIndicator) { autoSaveIndicator.style.display = 'none'; } } }

function renderTable(sheetName, jsonData) { const output = document.getElementById('output'); output.innerHTML = ""; const table = document.createElement('table'); const thead = document.createElement('thead'); const headerRow = document.createElement('tr'); const displayedHeaders = ["Mois", "Sem.", "Séan.", "Unité/Chapitre", "Contenu de la leçon", "Ressources (Leçons)", "Devoir", "Ressources (Devoirs)", "Recherche", "Projets"]; displayedHeaders.forEach(col => { const th = document.createElement('th'); th.textContent = col; headerRow.appendChild(th); }); thead.appendChild(headerRow); table.appendChild(thead); const tbody = document.createElement('tbody'); let sessionCounters = {}; let weekMaxSessions = {}; const baseClass = getBaseClassName(currentClass); const baseSessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][sheetName]) || 5; 
  jsonData.slice(1).forEach((row, dataIndex) => { const event = academicCalendar[dataIndex]; if (!event) return; const weekValue = event.week; if(!weekMaxSessions[weekValue]) { const specialDaysCount = jsonData.slice(1).filter((r, i) => { const e = academicCalendar[i]; return e && e.week === weekValue && !isPlannable(e) && isSpecialDay(e); }).length; weekMaxSessions[weekValue] = Math.max(1, baseSessionsPerWeek - specialDaysCount); }
    if(!sessionCounters[weekValue]) sessionCounters[weekValue] = 0; const isSpecialEvent = !isPlannable(event); const sessionsPerWeek = weekMaxSessions[weekValue]; const renderSession = (sessionNum) => { const rowElement = document.createElement('tr'); const originalRowIndex = savedData[sheetName].findIndex(originalRow => originalRow === row); const rowIndexForDB = originalRowIndex !== -1 ? originalRowIndex - 1 : -1; const monthTd = document.createElement('td'); monthTd.textContent = monthAbbreviations[row[0]] || row[0] || ''; rowElement.appendChild(monthTd); const weekTd = document.createElement('td'); if (isSpecialEvent) { weekTd.textContent = ''; } else { weekTd.textContent = row[1] ? row[1].replace('Semaine ', 'S') : ''; } rowElement.appendChild(weekTd); const seanceTd = document.createElement('td'); if (!isSpecialEvent) { seanceTd.textContent = sessionNum; } rowElement.appendChild(seanceTd); if (isSpecialEvent) { const mergedCell = document.createElement('td'); mergedCell.colSpan = displayedHeaders.length - 3; mergedCell.innerHTML = `<b>${event.type}</b>`; mergedCell.classList.add('merged-cell'); let bgColor = '#f2f2f2'; const typeLC = event.type.toLowerCase(); if (typeLC.includes('vacance')) bgColor = '#90EE90'; else if (typeLC.includes('examen')) bgColor = '#FFA07A'; else if (typeLC.includes('evaluation') || typeLC.includes('évaluation')) bgColor = '#FFB6C1'; else if (typeLC.includes('day')) bgColor = '#ADD8E6'; else if (typeLC.includes('orientation')) bgColor = '#FFD700';  mergedCell.style.backgroundColor = bgColor; rowElement.appendChild(mergedCell); } else { for (let i = 4; i < standardHeaders.length; i++) { const td = document.createElement('td'); const input = document.createElement('textarea'); input.value = row[i] || ''; input.className = 'modifiable-input'; input.dataset.rowIndex = rowIndexForDB; input.dataset.colIndex = i; td.appendChild(input); rowElement.appendChild(td); } } tbody.appendChild(rowElement); };
    if (isSpecialEvent) { renderSession(null); } else { const remainingSessions = sessionsPerWeek - sessionCounters[weekValue]; if (remainingSessions > 0) { const remainingDays = jsonData.slice(dataIndex).filter((r, i) => { const e = academicCalendar[dataIndex + i]; return e && e.week === weekValue && isPlannable(e); }).length; if (remainingDays > 0) { const sessionsThisDay = Math.ceil(remainingSessions / remainingDays); const actualSessions = Math.min(sessionsThisDay, remainingSessions); for (let s = 0; s < actualSessions; s++) { sessionCounters[weekValue]++; renderSession(sessionCounters[weekValue]); } } } } }); table.appendChild(tbody); output.appendChild(table); addEventListenersToTable(sheetName); applyFilter(); }

/**
 * Déclencher un enregistrement automatique après un délai
 */
// Fonction pour marquer qu'il y a des modifications non sauvegardées
function markAsModified() {
  hasUnsavedChanges = true;
  // Afficher un indicateur visuel
  showUnsavedIndicator();
}

// Fonction pour afficher l'indicateur de modifications non sauvegardées
function showUnsavedIndicator() {
  let indicator = document.getElementById('unsavedIndicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.id = 'unsavedIndicator';
    indicator.style.cssText = 'margin-left: 15px; color: #f59e0b; font-size: 14px; font-weight: 500;';
    indicator.innerHTML = '<i class="ri-alert-line"></i> Modifications non sauvegardées';
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
      buttonContainer.appendChild(indicator);
    }
  }
  indicator.style.display = 'inline';
}

// Fonction pour cacher l'indicateur après sauvegarde
function hideUnsavedIndicator() {
  const indicator = document.getElementById('unsavedIndicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
  hasUnsavedChanges = false;
}

function addEventListenersToTable(sheetName) { document.querySelectorAll('#output .modifiable-input').forEach(input => { input.addEventListener('input', (e) => { const rowIndex = parseInt(e.target.dataset.rowIndex); const colIndex = parseInt(e.target.dataset.colIndex); if (rowIndex >= 0 && savedData[sheetName]?.[rowIndex + 1]) { savedData[sheetName][rowIndex + 1][colIndex] = e.target.value; markAsModified(); } }); }); }

function populateFilterOptions() { const filterBy = document.getElementById('filterBy').value; const selectedMatiere = document.getElementById('matiereSelect').value; const filterOptionsSelect = document.getElementById('filterOptions'); filterOptionsSelect.innerHTML = ''; filterOptionsSelect.style.display = 'none'; if (!selectedMatiere || !filterBy || !savedData[selectedMatiere]) { return; } const columnIndex = {Mois: 0, Semaine: 1}[filterBy]; if (columnIndex === undefined) { return; } const options = new Set(); const data = savedData[selectedMatiere]; if (data && data.length > 1) { data.slice(1).forEach((row, i) => { const event = academicCalendar[i]; if (event) { const cellValue = (filterBy === 'Mois' ? event.month : event.week); if (cellValue) { options.add(cellValue); } } }); } if (options.size > 0) { filterOptionsSelect.style.display = 'inline-block'; filterOptionsSelect.innerHTML = '<option value="">Tous</option>'; Array.from(options).sort((a, b) => { if (filterBy === 'Semaine') { const aNum = parseInt(a.replace('Semaine ', '')); const bNum = parseInt(b.replace('Semaine ', '')); return aNum - bNum; } return a.localeCompare(b); }).forEach(optionValue => { filterOptionsSelect.innerHTML += `<option value="${optionValue}">${optionValue}</option>`; }); } applyFilter(); }

function applyFilter() { toggleFilledRows(); }

function clearFilter() { document.getElementById('filterBy').value = ""; document.getElementById('filterOptions').innerHTML = ""; document.getElementById('filterOptions').style.display = 'none'; document.getElementById('showFilledOnly').checked = false; toggleFilledRows(); }

function toggleFilledRows() { const showFilledOnly = document.getElementById('showFilledOnly').checked; const tableBody = document.querySelector('#output table tbody'); if (!tableBody) return; const filterBy = document.getElementById('filterBy').value; const filterValue = document.getElementById('filterOptions').value; tableBody.querySelectorAll('tr').forEach((rowElement) => { let isVisible = true; const monthCell = rowElement.querySelector('td:nth-child(1)'); const weekCell = rowElement.querySelector('td:nth-child(2)'); if (filterBy && filterValue && monthCell && weekCell) { const monthValue = monthCell.textContent.trim(); const weekValue = weekCell.textContent.trim(); if (filterBy === 'Mois') { const fullMonth = Object.keys(monthAbbreviations).find(key => monthAbbreviations[key] === monthValue); if (fullMonth !== filterValue && monthValue !== filterValue) { isVisible = false; } } else if (filterBy === 'Semaine') { const fullWeek = weekValue.startsWith('S') ? 'Semaine ' + weekValue.substring(1) : weekValue; if (fullWeek !== filterValue && weekValue !== filterValue) { isVisible = false; } } } if (showFilledOnly && isVisible) { let isFilled = false; if (rowElement.querySelector('.merged-cell')) { isFilled = false; } else { const textInputs = rowElement.querySelectorAll('.modifiable-input'); textInputs.forEach(input => { if (input.value.trim() !== '') isFilled = true; }); } if (!isFilled) isVisible = false; } rowElement.style.display = isVisible ? '' : 'none'; }); }

function showProgressBar(){const bar=document.getElementById('progressBar');bar.style.display='block';bar.firstElementChild.style.width='10%';}
function hideProgressBar(){const bar=document.getElementById('progressBar');bar.style.display='none';bar.firstElementChild.style.width='0';}

async function handleDocxImport(event) { 
  const selectedMatiere = document.getElementById('matiereSelect').value; 
  if (!currentClass || !selectedMatiere) { 
    alert("Veuillez d'abord sélectionner une classe et une matière."); 
    event.target.value = ''; 
    return; 
  } 
  const file = event.target.files[0]; 
  if (!file) return; 
  showProgressBar(); 
  try { 
    const arrayBuf = await file.arrayBuffer(); 
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf))); 
    const resp = await apiCall('importDocxAnalyze', { className: currentClass, sheetName: selectedMatiere, fileName: file.name, fileBase64: base64 }); 
    if (resp.success && Array.isArray(resp.sessions)) { 
      const sessions = resp.sessions; 
      const baseClass = getBaseClassName(currentClass);
      const sessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][selectedMatiere]) || 5; 
      
      // FIX: Ensure savedData matches calendar length before processing
      if (savedData[selectedMatiere].length !== academicCalendar.length + 1) {
        console.warn('Calendar mismatch in AI import. Regenerating structure.');
        savedData[selectedMatiere] = generateInitialData();
      }
      
      const slots = []; 
      let counters = {}; 
      savedData[selectedMatiere].slice(1).forEach((row, idx) => { const ev = academicCalendar[idx]; if (!ev) return; const week = ev.week; if (!counters[week]) counters[week] = 0; if (isPlannable(ev)) { if (counters[week] < sessionsPerWeek) { slots.push(row); } counters[week]++; } }); let i = 0; for (const slot of slots) { if (i >= sessions.length) break; const it = sessions[i++]; slot[4] = (it.unite || '').toString(); slot[5] = (it.contenu || '').toString(); slot[6] = (it.ressources_lecon || '').toString(); slot[7] = (it.devoir || '').toString(); slot[8] = (it.ressources_devoir || '').toString(); slot[9] = (it.recherche || '').toString(); slot[10] = (it.projet || '').toString(); } const weekGroups = {}; savedData[selectedMatiere].slice(1).forEach((row, idx) => { const ev = academicCalendar[idx]; if (!ev) return; if (!weekGroups[ev.week]) weekGroups[ev.week] = []; weekGroups[ev.week].push(row); }); Object.keys(weekGroups).forEach(w => { const rows = weekGroups[w]; const last = rows[rows.length - 1]; const lastTheme = rows.map(r => r[4]).filter(Boolean).pop() || selectedMatiere; if (last) { if (!last[9]) last[9] = `Recherche: approfondissement sur ${lastTheme}`; if (!last[10]) last[10] = `Projet: application pratique sur ${lastTheme}`; } }); renderTable(selectedMatiere, savedData[selectedMatiere]); await saveTable(true); showSuccessMessage('Import Word terminé et plan auto-rempli (IA).'); } else { showErrorMessage('Réponse IA invalide.'); } } catch (err) { console.error(err); showErrorMessage('Import DOCX échoué: ' + err.message); } finally { hideProgressBar(); event.target.value = ''; } }

function handleFileUpload(event) { if (!currentClass || !document.getElementById('matiereSelect').value) { alert("Veuillez d'abord sélectionner une classe et une matière."); event.target.value = ''; return; } const file = event.target.files[0]; if (file) { showProgressBar(); const reader = new FileReader(); reader.onload = async (e) => { try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); const firstSheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[firstSheetName]; const importedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); fillTableWithExcelData(importedData); } catch (error) { console.error("Erreur lors de l'importation du fichier:", error); alert("Une erreur s'est produite lors de la lecture du fichier Excel."); } finally { hideProgressBar(); event.target.value = ''; } }; reader.readAsArrayBuffer(file); } }

function fillTableWithExcelData(importedData) { const selectedMatiere = document.getElementById('matiereSelect').value; if (!currentClass || !selectedMatiere) { alert("Veuillez d'abord sélectionner une classe et une matière."); return; } const headerOffset = importedData[0]?.[0]?.toLowerCase().includes('unité') || importedData[0]?.[1]?.toLowerCase().includes('contenu') ? 1 : 0; const dataToImport = importedData.slice(headerOffset); const baseClass = getBaseClassName(currentClass); const sessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][selectedMatiere]) || 0; const availableSlots = []; let sessionCounters = {}; savedData[selectedMatiere].slice(1).forEach((appRow, appRowIndex) => { const event = academicCalendar[appRowIndex]; const weekValue = event.week; if(!sessionCounters[weekValue]) sessionCounters[weekValue] = 0; if (isPlannable(event)) { if (sessionCounters[weekValue] < sessionsPerWeek) { availableSlots.push(appRow); } sessionCounters[weekValue]++; } }); const numberOfRowsToImport = Math.min(dataToImport.length, availableSlots.length); dataToImport.forEach((importedRow, importIndex) => { if (importIndex < numberOfRowsToImport) { const targetRow = availableSlots[importIndex]; for(let i = 0; i < 7; i++) { targetRow[i + 4] = importedRow[i] || ''; } } }); renderTable(selectedMatiere, savedData[selectedMatiere]); saveTable(true); const weeksImported = Math.ceil(numberOfRowsToImport / (sessionsPerWeek || 1)); alert(`Importation terminée ! ${numberOfRowsToImport} séances ont été remplies (environ ${weeksImported} semaines). Les données existantes après ces lignes ont été préservées.`); }

function prepareExcelDataForSubject(subjectName) { 
  const sheetData = savedData[subjectName]; 
  if (!sheetData || sheetData.length <= 1) { return null; }
  
  // FIX: Ensure savedData matches current calendar length (210 entries + 1 header = 211)
  // If old data exists (155 rows), regenerate with new calendar
  if (sheetData.length !== academicCalendar.length + 1) {
    console.warn('Calendar length mismatch detected. Regenerating data structure.');
    savedData[subjectName] = generateInitialData();
    return prepareExcelDataForSubject(subjectName); // Recursive call with fixed data
  }
   const exportHeaders = ["Mois", "Semaine", "Séance", "Unité/Chapitre", "Contenu de la leçon", "Ressources pour les leçons", "Devoir", "Ressources pour les devoirs", "Recherche", "Projets"]; const dataForExport = [exportHeaders]; let sessionCounters = {}; let weekMaxSessions = {}; const baseClass = getBaseClassName(currentClass); const baseSessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][subjectName]) || 5; 
  
  // Utiliser la MÊME logique que renderTable pour l'export
  // MODIFICATION: N'exporter QUE les lignes de type "Cours" et "evaluation"
  sheetData.slice(1).forEach((row, dataIndex) => { 
    const event = academicCalendar[dataIndex]; 
    if (!event) return; 
    const weekValue = event.week; 
    
    // Calculer weekMaxSessions pour cette semaine
    if (!weekMaxSessions[weekValue]) { 
      const specialDays = sheetData.slice(1).filter((r, i) => { 
        const e = academicCalendar[i]; 
        return e && e.week === weekValue && !isPlannable(e) && isSpecialDay(e); 
      }).length; 
      weekMaxSessions[weekValue] = Math.max(1, baseSessionsPerWeek - specialDays); 
    } 
    
    if (!sessionCounters[weekValue]) sessionCounters[weekValue] = 0; 
    const sessionsPerWeek = weekMaxSessions[weekValue]; 
    const isSpecialEvent = !isPlannable(event);
    const eventType = event.type.toLowerCase();
    
    // FILTRE: Exporter SEULEMENT "Cours" et "evaluation"
    // Exclure: Vacances, Examens, Orientation, Jours fériés, etc.
    const shouldExport = isPlannable(event) || eventType.includes('evaluation') || eventType.includes('évaluation');
    
    if (!shouldExport) {
      // Ignorer cette ligne (vacances, examens, jours fériés, etc.)
      return;
    }
    
    // Si c'est une évaluation, exporter comme ligne spéciale
    if (isSpecialEvent && (eventType.includes('evaluation') || eventType.includes('évaluation'))) { 
      dataForExport.push([ 
        monthAbbreviations[row[0]] || row[0] || '', 
        '', 
        '', 
        event.type, 
        '', '', '', '', '', '' 
      ]); 
    } else if (isPlannable(event)) {
      // Si c'est un jour plannable (Cours), utiliser la MÊME logique que renderTable
      const remainingSessions = sessionsPerWeek - sessionCounters[weekValue];
      if (remainingSessions > 0) {
        const remainingDays = sheetData.slice(1).slice(dataIndex).filter((r, i) => {
          const e = academicCalendar[dataIndex + i];
          return e && e.week === weekValue && isPlannable(e);
        }).length;
        
        if (remainingDays > 0) {
          const sessionsThisDay = Math.ceil(remainingSessions / remainingDays);
          const actualSessions = Math.min(sessionsThisDay, remainingSessions);
          
          // Exporter plusieurs séances pour ce jour si nécessaire
          for (let s = 0; s < actualSessions; s++) {
            sessionCounters[weekValue]++;
            dataForExport.push([ 
              monthAbbreviations[row[0]] || row[0] || '', 
              row[1] ? row[1].replace('Semaine ', 'S') : '', 
              sessionCounters[weekValue], 
              row[4] || '', 
              row[5] || '', 
              row[6] || '', 
              row[7] || '', 
              row[8] || '', 
              row[9] || '', 
              row[10] || '' 
            ]);
          }
        }
      }
    }
  }); 
  return dataForExport; }

function prepareWordDataForSubject(subjectName, subjectData, className) { const data = subjectData.slice(1); const dataForWord = data.filter((row, i) => academicCalendar[i] && academicCalendar[i].month !== 'Août'); const calendarForWord = academicCalendar.filter(event => event && event.month !== 'Août'); const dataByWeek = {}; function getWeekNumber(weekString) { const match = weekString.match(/Semaine (\d+)/); return match ? parseInt(match[1], 10) : null; } dataForWord.forEach((row, index) => { const event = calendarForWord[index]; if (!event) return; const week = event.week; const weekNum = getWeekNumber(week); if (weekNum && !dataByWeek[weekNum]) { dataByWeek[weekNum] = { week_name: week, seances: [] }; } }); let sessionCounters = {}; let weekMaxSessions = {}; const baseClass = getBaseClassName(className); const baseSessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][subjectName]) || 5; dataForWord.forEach((row, index) => { const event = calendarForWord[index]; if (!event) return; const week = event.week; const weekNum = getWeekNumber(week); if (!weekNum) return; if (!weekMaxSessions[weekNum]) { const specialDays = calendarForWord.filter((e) => { return e && e.week === week && !isPlannable(e) && isSpecialDay(e); }).length; weekMaxSessions[weekNum] = Math.max(1, baseSessionsPerWeek - specialDays); } if (!sessionCounters[weekNum]) sessionCounters[weekNum] = 0; const isSpecialEvent = !isPlannable(event); const sessionsPerWeek = weekMaxSessions[weekNum]; if (!isSpecialEvent) { const remainingSessions = sessionsPerWeek - sessionCounters[weekNum]; if (remainingSessions > 0) { const remainingDays = calendarForWord.slice(index).filter((e) => { return e && e.week === week && isPlannable(e); }).length; if (remainingDays > 0) { const sessionsThisDay = Math.ceil(remainingSessions / remainingDays); const actualSessions = Math.min(sessionsThisDay, remainingSessions); for (let s = 0; s < actualSessions; s++) { sessionCounters[weekNum]++; const seanceData = { seance_num: sessionCounters[weekNum], chapitre: row[4] || '', contenu_lecon: row[5] || '', res_lecon: row[6] || '', devoir: row[7] || '', res_devoir: row[8] || '', recherche: row[9] || '', projet: row[10] || '' }; dataByWeek[weekNum].seances.push(seanceData); } } } } else { const weekSeances = dataByWeek[weekNum].seances; if (!weekSeances.some(s => s.chapitre === event.type)) { const specialSeance = { seance_num: ' ', chapitre: event.type, contenu_lecon: '', res_lecon: '', devoir: '', res_devoir: '', recherche: '', projet: '' }; dataByWeek[weekNum].seances.push(specialSeance); } } }); const templateData = { class_name: className, subject_name: subjectName }; Object.keys(dataByWeek).forEach(weekNum => { const weekData = dataByWeek[weekNum]; const weekKey = `week${weekNum}`; const sortedSeances = weekData.seances.sort((a, b) => { if (a.seance_num === ' ') return -1; if (b.seance_num === ' ') return 1; return a.seance_num - b.seance_num; }); templateData[`${weekKey}_name`] = weekData.week_name; templateData[`${weekKey}_seances`] = sortedSeances; }); return templateData; }

// Auto-normalisation pour respecter STRICTEMENT le calendrier officiel sans réinitialiser la matière
function needsNormalization(subjectName){
  const data = savedData[subjectName];
  if (!data || data.length <= 1) return false;
  if (data.length !== academicCalendar.length + 1) return true;
  let trigger = false;
  data.slice(1).forEach((row, idx) => {
    const ev = academicCalendar[idx];
    if (!ev) return;
    const hasContent = row.slice(4, 11).some(v => (v || '').toString().trim() !== '');
    if (hasContent && !isPlannable(ev)) trigger = true;
    if (!trigger && row.slice(4, 11).some(v => (v || '').toString().toLowerCase().includes('long weekend') || (v || '').toString().toLowerCase().includes('weekend'))) trigger = true;
  });
  return trigger;
}
function normalizeSavedDataForSubject(subjectName){
  const data = savedData[subjectName];
  if (!data || data.length <= 1) return;
  const queue = [];
  data.slice(1).forEach((row) => {
    const payload = row.slice(4, 11).map(v => (v || '').toString());
    const hasAny = payload.some(v => v.trim() !== '');
    if (hasAny) queue.push(payload);
  });
  data.slice(1).forEach((row) => { for (let i = 4; i <= 10; i++) row[i] = ''; });
  const baseClass = getBaseClassName(currentClass);
  const sessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][subjectName]) || 5;
  const counters = {};
  data.slice(1).forEach((row, idx) => {
    const ev = academicCalendar[idx];
    if (!ev) return;
    const week = ev.week;
    if (!counters[week]) counters[week] = 0;
    if (isPlannable(ev) && counters[week] < sessionsPerWeek && queue.length > 0){
      const payload = queue.shift();
      for (let i = 0; i < payload.length; i++) row[4 + i] = payload[i];
      counters[week]++;
    }
  });
  const byWeek = {};
  data.slice(1).forEach((row, idx) => {
    const ev = academicCalendar[idx];
    if (!ev) return;
    if (!byWeek[ev.week]) byWeek[ev.week] = [];
    byWeek[ev.week].push({ row, ev });
  });
  Object.keys(byWeek).forEach(week => {
    const items = byWeek[week];
    const lastPlannable = [...items].reverse().find(it => isPlannable(it.ev));
    if (lastPlannable){
      const r = lastPlannable.row;
      if (!r[9] || !r[9].toString().trim()) r[9] = `Recherche: approfondissement sur ${subjectName}`;
      if (!r[10] || !r[10].toString().trim()) r[10] = `Projet: application pratique sur ${subjectName}`;
    }
  });
}

// === FONCTIONS DE GÉNÉRATION EXCEL ===
function generateExcel() {
  const selectedMatiere = document.getElementById('matiereSelect').value;
  if (!currentClass || !selectedMatiere) {
    alert("Veuillez sélectionner une classe et une matière.");
    return;
  }
  const dataForExport = prepareExcelDataForSubject(selectedMatiere);
  if (!dataForExport) {
    alert("Pas de données à exporter.");
    return;
  }
  const worksheet = XLSX.utils.aoa_to_sheet(dataForExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, selectedMatiere);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `${currentClass}_${selectedMatiere}_Distribution.xlsx`);
  showSuccessMessage("Fichier Excel généré avec succès!");
}

async function generateExcelZipForClass() {
  if (!currentClass) {
    alert("Veuillez d'abord sélectionner une classe.");
    return;
  }
  if (Object.keys(savedData).length === 0) {
    alert("Les données de la classe ne sont pas encore chargées. Veuillez patienter ou recharger.");
    return;
  }
  showProgressBar();
  try {
    const zip = new JSZip();
    const subjects = classSubjects[currentClass];
    if (!subjects || subjects.length === 0) {
      throw new Error("Aucune matière n'est définie pour cette classe.");
    }
    for (const subject of subjects) {
      const dataForExport = prepareExcelDataForSubject(subject);
      if (dataForExport) {
        const worksheet = XLSX.utils.aoa_to_sheet(dataForExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, subject);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file(`${currentClass}_${subject}_Distribution.xlsx`, excelBuffer);
      }
    }
    if (Object.keys(zip.files).length > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Distribution_Excel_${currentClass}.zip`);
      showSuccessMessage("Archive ZIP des fichiers Excel générée avec succès!");
    } else {
      alert("Aucun document Excel n'a pu être généré. Vérifiez que les matières contiennent des données.");
    }
  } catch (error) {
    console.error('Erreur lors de la génération du ZIP de fichiers Excel:', error);
    showErrorMessage('Une erreur est survenue : ' + error.message);
  } finally {
    hideProgressBar();
  }
}

showInitialSelection();

// === NOUVELLE FONCTIONNALITÉ: Distribution Automatique avec IA Gemini ===
async function generateAIDistribution() {
  const selectedMatiere = document.getElementById('matiereSelect').value;
  if (!currentClass || !selectedMatiere) {
    alert("Veuillez d'abord sélectionner une matière.");
    return;
  }
  
  // Vérifier que c'est bien la section garçons
  if (!currentIsBoysSection) {
    alert("Cette fonctionnalité est disponible uniquement dans la section 'Secondaire Garçons'.");
    return;
  }
  
  const manuelSummary = document.getElementById('manuelSummary').value.trim();
  const cahierSummary = document.getElementById('cahierSummary').value.trim();
  
  if (!manuelSummary || !cahierSummary) {
    alert("Veuillez remplir les deux sommaires (livre manuel ET cahier d'activité).");
    return;
  }
  
  if (!confirm(`Générer automatiquement la distribution pour "${selectedMatiere}" ?\n\nCette action remplacera le contenu actuel par la distribution générée par l'IA.`)) {
    return;
  }
  
  showProgressBar();
  try {
    const resp = await apiCall('generateAIDistributionGemini', {
      className: currentClass,
      sheetName: selectedMatiere,
      manuelSummary: manuelSummary,
      cahierSummary: cahierSummary
    });
    
    if (resp.success && Array.isArray(resp.sessions)) {
      const sessions = resp.sessions;
      const baseClass = getBaseClassName(currentClass);
      const sessionsPerWeek = (classSessionCounts[baseClass] && classSessionCounts[baseClass][selectedMatiere]) || 5;
      
      // Ensure savedData matches calendar length
      if (savedData[selectedMatiere].length !== academicCalendar.length + 1) {
        console.warn('Calendar mismatch in AI distribution. Regenerating structure.');
        savedData[selectedMatiere] = generateInitialData();
      }
      
      // Remplir les slots disponibles avec les sessions IA
      const slots = [];
      let counters = {};
      savedData[selectedMatiere].slice(1).forEach((row, idx) => {
        const ev = academicCalendar[idx];
        if (!ev) return;
        const week = ev.week;
        if (!counters[week]) counters[week] = 0;
        if (isPlannable(ev)) {
          if (counters[week] < sessionsPerWeek) {
            slots.push(row);
          }
          counters[week]++;
        }
      });
      
      let i = 0;
      for (const slot of slots) {
        if (i >= sessions.length) break;
        const session = sessions[i++];
        slot[4] = (session.unite || '').toString();
        slot[5] = (session.contenu || '').toString();
        slot[6] = (session.ressources_lecon || '').toString();
        slot[7] = (session.devoir || '').toString();
        slot[8] = (session.ressources_devoir || '').toString();
        slot[9] = (session.recherche || '').toString();
        slot[10] = (session.projet || '').toString();
      }
      
      // Compléter recherche/projet en fin de semaine
      const weekGroups = {};
      savedData[selectedMatiere].slice(1).forEach((row, idx) => {
        const ev = academicCalendar[idx];
        if (!ev) return;
        if (!weekGroups[ev.week]) weekGroups[ev.week] = [];
        weekGroups[ev.week].push(row);
      });
      
      Object.keys(weekGroups).forEach(w => {
        const rows = weekGroups[w];
        const last = rows[rows.length - 1];
        const lastTheme = rows.map(r => r[4]).filter(Boolean).pop() || selectedMatiere;
        if (last) {
          if (!last[9]) last[9] = `Recherche: approfondissement sur ${lastTheme}`;
          if (!last[10]) last[10] = `Projet: application pratique sur ${lastTheme}`;
        }
      });
      
      renderTable(selectedMatiere, savedData[selectedMatiere]);
      await saveTable(true);
      showSuccessMessage('Distribution automatique générée avec succès ! La matière a été remplie selon les sommaires fournis.');
      
      // Vider les champs et cacher le formulaire après succès
      document.getElementById('manuelSummary').value = '';
      document.getElementById('cahierSummary').value = '';
      toggleAIForm(); // Fermer le formulaire
    } else {
      showErrorMessage('Réponse IA invalide. Veuillez réessayer.');
    }
  } catch (err) {
    console.error('Erreur distribution automatique:', err);
    showErrorMessage('Erreur lors de la génération automatique: ' + err.message);
  } finally {
    hideProgressBar();
  }
}

/**
 * Afficher/Cacher le formulaire de génération IA
 */
function toggleAIForm() {
  const aiSection = document.getElementById('aiDistributionSection');
  if (aiSection) {
    if (aiSection.style.display === 'none' || aiSection.style.display === '') {
      aiSection.style.display = 'block';
      // Scroll vers le formulaire
      aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      aiSection.style.display = 'none';
      // Vider les champs en cas d'annulation
      document.getElementById('manuelSummary').value = '';
      document.getElementById('cahierSummary').value = '';
    }
  }
}

// Avertissement avant de quitter si modifications non sauvegardées
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    const message = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter?';
    e.preventDefault();
    e.returnValue = message;
    return message;
  }
});

// Avertissement lors du changement de classe ou matière
function warnIfUnsaved() {
  if (hasUnsavedChanges) {
    return confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment changer sans enregistrer?');
  }
  return true;
}

/**
 * Télécharger le fichier Excel hebdomadaire pour toutes les classes et matières
 * @param {string} section - La section à filtrer : 'maternelle', 'primaire', 'secondaire', 'secondaire-garcons'
 */
async function downloadWeeklyExcel(section) {
  // Déterminer quel sélecteur de semaine utiliser selon la section
  let weekSelectId;
  let sectionName;
  
  switch(section) {
    case 'maternelle':
      weekSelectId = 'weekSelectMaternelle';
      sectionName = 'Maternelle';
      break;
    case 'primaire':
      weekSelectId = 'weekSelectPrimaire';
      sectionName = 'Primaire';
      break;
    case 'secondaire':
      weekSelectId = 'weekSelectSecondaire';
      sectionName = 'Secondaire';
      break;
    case 'secondaire-garcons':
      weekSelectId = 'weekSelectGarcons';
      sectionName = 'Secondaire Garçons';
      break;
    default:
      alert('Section invalide');
      return;
  }
  
  const weekSelect = document.getElementById(weekSelectId);
  if (!weekSelect) {
    alert('Erreur: sélecteur de semaine introuvable');
    return;
  }
  
  const selectedWeek = weekSelect.value;
  
  if (!selectedWeek) {
    alert('Veuillez sélectionner une semaine avant de télécharger.');
    return;
  }
  
  if (!confirm(`Télécharger la distribution de "${selectedWeek}" pour la section ${sectionName}?\n\nCela peut prendre quelques instants.`)) {
    return;
  }
  
  try {
    // Étape 1: Initialisation
    showProgressWithPercentage('Connexion au serveur...', 10);
    
    const response = await fetch('/api/downloadWeeklyExcel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week: selectedWeek, section: section })
    });
    
    // Étape 2: Vérification de la réponse
    showProgressWithPercentage('Récupération des données...', 30);
    
    if (!response.ok) {
      let errorMessage = `Erreur du serveur: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Afficher les détails supplémentaires si disponibles
        if (errorData.details) {
          console.error('Détails de l\'erreur:', errorData.details);
          const details = errorData.details;
          errorMessage += `\n\n📊 Détails du traitement:\n`;
          errorMessage += `• Classes traitées: ${details.classesProcessed || 0}\n`;
          errorMessage += `• Classes avec données: ${details.classesWithData || 0}\n`;
          errorMessage += `• MongoDB configuré: ${details.mongoConfigured ? '✅ Oui' : '❌ Non'}\n`;
          
          if (details.classesProcessed > 0 && details.classesWithData === 0) {
            errorMessage += `\n⚠️ Aucune donnée trouvée pour "${selectedWeek}".\n`;
            errorMessage += `Veuillez d'abord enregistrer des distributions pour cette semaine.`;
          }
        }
      } catch (e) {
        // Erreur lors du parsing JSON
        console.error('Erreur parsing:', e);
      }
      hideProgressWithPercentage();
      throw new Error(errorMessage);
    }
    
    // Étape 3: Génération du fichier
    showProgressWithPercentage('Génération du fichier Excel...', 60);
    
    const blob = await response.blob();
    
    // Vérifier si le blob est vide
    if (blob.size === 0) {
      hideProgressWithPercentage();
      throw new Error('Le fichier généré est vide. Aucune donnée disponible pour cette semaine.');
    }
    
    // Étape 4: Téléchargement
    showProgressWithPercentage('Préparation du téléchargement...', 90);
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Distribution_${sectionName.replace(/\s+/g, '_')}_${selectedWeek.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyage
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    // Étape 5: Terminé
    showProgressWithPercentage('Téléchargement terminé!', 100);
    
    setTimeout(() => {
      hideProgressWithPercentage();
      showSuccessMessage(`✅ Fichier Excel téléchargé avec succès!\n📁 ${a.download}`);
    }, 500);
    
  } catch (error) {
    console.error('Erreur lors du téléchargement Excel hebdomadaire:', error);
    hideProgressWithPercentage();
    showErrorMessage('❌ Erreur lors de la génération du fichier Excel:\n\n' + error.message, 10000);
  }
}

// DEBUG: Vérifier la structure MongoDB
async function debugMongoData(className, subject) {
  try {
    console.log(`[DEBUG] Checking MongoDB for ${className} - ${subject}`);
    
    const response = await fetch('/api/debugMongoData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ className, subject })
    });
    
    const result = await response.json();
    console.log('[DEBUG] MongoDB Result:', result);
    
    if (result.found && result.sampleRows) {
      console.log('[DEBUG] Sample rows:', result.sampleRows);
      console.log('[DEBUG] Week fields:', result.weekFields);
      console.log('[DEBUG] Total rows:', result.totalRows);
    } else {
      console.log('[DEBUG] No data found');
    }
    
    return result;
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return null;
  }
}

// Exposer la fonction globalement pour tests manuels
window.debugMongoData = debugMongoData;

