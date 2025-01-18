import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMRdInzdOXVlsvkUUG6CdChL8IWsr538g",
    authDomain: "logistics-manage.firebaseapp.com",
    projectId: "logistics-manage",
    storageBucket: "logistics-manage.appspot.com",
    messagingSenderId: "265052464205",
    appId: "1:265052464205:web:78194d536f2852bc27e804",
    measurementId: "G-5BPR6L0XRQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const generateToken = async () => {
    const per = await Notification.requestPermission();
    if (per === "granted") {
        var token = await getToken(messaging, { vapidKey: "BIaKm2pLMb67SO8nzEf6ZeMvnFUCmgZzGepyG5YHgPunUUfmX93vZGlqIT4L_pG0EqSxPDOw-hPdgSZo4m6u_IY" })
        return token;
    }
    else {
        return null;
    }
}

export const unsubscribeToken = async () => {
    try {
        const per = await Notification.requestPermission();
        if (per === "granted") {
            var token = await getToken(messaging, { vapidKey: "BIaKm2pLMb67SO8nzEf6ZeMvnFUCmgZzGepyG5YHgPunUUfmX93vZGlqIT4L_pG0EqSxPDOw-hPdgSZo4m6u_IY" })
            await deleteToken(messaging);
            return token;
        }
        else {
            return null;
        }
    } catch (error) {
        var token = await getToken(messaging, { vapidKey: "BIaKm2pLMb67SO8nzEf6ZeMvnFUCmgZzGepyG5YHgPunUUfmX93vZGlqIT4L_pG0EqSxPDOw-hPdgSZo4m6u_IY" })
        return token;
    }

}