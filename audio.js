// BGM(loop) -----------------------------------------------------------------------------------------

const sound_bgm_list = {
    Etude_Plus_Op10No1_MSumi: 'Etude_Plus_Op10No1_MSumi'
};
var mirror_sound_bgm = {};

var sound_play_time = Date.now();
var sound_repeat_time = Date.now();
var sound_queue = [];
const sound_sleeptime = 1500;

function initSound_bgm() {
    for (let key in sound_bgm_list) {
        if (!mirror_sound_bgm[key]) {
            mirror_sound_bgm[key] = new Audio('./music/sound_' + sound_bgm_list[key] + ".mp3");
            mirror_sound_bgm[key].load();
        }
    }
}

function playBGM(){
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].play();
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = VOLUME_BGM;
    }
}

function stopBGM() {
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].pause();
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].currentTime = 0;
    }
}

function SetBGMVolume(volume){
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = volume;
    }
}

function pauseBgm() {
    for (let i = 0; i < sound_name.length; i++) {
        if (mirror_sound_bgm[i] != null) { mirror_sound_bgm[i].pause(); }
    }
}

// Sound (Sound Effect): play as soon as possible  -----------------------------------------------------------------------------------------
const sound_se_list = {
    se_Shining_soundeffectlab: "se_Shining_soundeffectlab",
    se_GoblinShout_soundeffectlab: "se_GoblinShout_soundeffectlab",
    se_Punch_soundeffectlab: "se_Punch_soundeffectlab",
    se_MagicCharge1_soundeffectlab: "se_MagicCharge1_soundeffectlab",
    se_MagicCharge2_soundeffectlab: "se_MagicCharge2_soundeffectlab",
    se_Cheers_soundeffectlab: "se_Cheers_soundeffectlab",
    se_CheersStadium_soundeffectlab: "se_CheersStadium_soundeffectlab",
    se_CheersEnding_soundeffectlab: "se_CheersEnding_soundeffectlab"
};
var mirror_sound_se = {};

function initSound_se() {
    for (let key in sound_se_list) {
        if (!mirror_sound_se[key]) {
            console.log("load" + key);
            mirror_sound_se[key] = new Audio('./music/sound_' + sound_se_list[key] + ".mp3");
            mirror_sound_se[key].load();
        }
    }
}

function playSound_se(key, volume){
    if (mirror_sound_se[key] != null) {
        mirror_sound_se[key].currentTime = 0;
        mirror_sound_se[key].volume = VOLUME_SE * volume;
        mirror_sound_se[key].play();
    }
}

// Sound (Navigation): waits for a while after previous navigation -----------------------------------------------------------------------------------------
const sound_navigation_list = {
    Setup: "Setup",
    GameStart: "GameStart",
    GameEnd: "GameEnd",
    GameComplete: "GameComplete",
    Not_synchronized: "Not_synchronized",
    Synchronized_alert: "Synchronized_alert",
    FoundManInTheMirror: "FoundManInTheMirror",
    LostManInTheMirror: "LostManInTheMirror",
    FoundManInFrontOfTheMirror: "FoundManInFrontOfTheMirror",
    LostManInFrontOfTheMirror: "LostManInFrontOfTheMirror",
    LostPlayers: "LostPlayers"
};
var mirror_sound_navigation = {};
var pre_play_navigation_sound = -1;

var navigation_sound_play_time = Date.now();
var navigation_sound_repeat_time = Date.now();
var navigation_sound_queue = [];
const navigation_sound_sleeptime = 1500;

function initSound_navigation() {
    for (let key in sound_navigation_list) {
        if (!mirror_sound_navigation[key]) {
            mirror_sound_navigation[key] = new Audio('./music/sound_' + sound_navigation_list[key] + ".mp3");
            mirror_sound_navigation[key].load();
        }
    }
}

function playNavigationSound(key){
    if (language === "ja") {
        if (pre_play_navigation_sound == key) return; // avoid duplicate play
        navigation_sound_queue.push(key);
        pre_play_navigation_sound = key;
        playNavigationQueue();
      } else {
        speech_push(get_navigation_en_speech(key));
      }
}

function playNavigationQueue(){
    if(Date.now() - navigation_sound_play_time < navigation_sound_sleeptime) return;
    if(navigation_sound_queue.length != 0){
        if (mirror_sound_navigation[navigation_sound_queue[0]] != null) {
            mirror_sound_navigation[navigation_sound_queue[0]].volume = VOLUME_NAVIGATION;
            mirror_sound_navigation[navigation_sound_queue[0]].play();
            navigation_sound_queue.shift();
            navigation_sound_play_time = Date.now();
            return true;    // Played
        }
    }
    return false;   // not played
}

// Speech(PC) -----------------------------------------------------------------------------------------

const speech_text = Object.freeze({
    GameInstruction1: "みらーおぶてらーにようこそ。かがみのせかいにまよいこんでしまったみたいですね。このげーむは、ふたりであそびます。ぽーずをとるひと、それをまねするひとにわかれてください。",
    GameInstruction2: "ぽーずをとるひとはかがみのまえにたち。まねするひとはかがみのなかにたってください。きゅうじゅうびょう かがみになりきることができれば、かがみのせかいからぬけだせます。",
    Setup: "かがみのまえとなかにたってください",
    GameStart: "げーむをかいしします",
    GameEnd: "げーむしゅうりょうです",
    GameComplete: "よくできました。げーむかんりょうです",
    Not_synchronized: "ずれています",
    synchronized_alert: "まったくあっていませんよ",
    FoundManInTheMirror: "かがみのなかのひとをみつけました",
    LostManInTheMirror: "かがみのなかのひとをみうしないました",
    FoundManInFrontOfTheMirror: "かがみのまえのひとをみつけました",
    LostManInFrontOfTheMirror: "かがみのまえのひとをみうしないました",
    LostPlayers: "ぷれーやーがいなくなりました",
    ReadScore: "てんです",
    Announce_10sec: "ぽーずをあわせましょう。あっていればぽいんとがはいります",
    Announce_30sec: "ぽーずをあわせたままうごくとぽいんとあっぷ",
    Announce_60sec: "ぼーなすたいむ。とくてんがばいになります"
});

const speech_text_en = Object.freeze({
    GameInstruction1: "Welcome to Mirror of Terror. It seems like you've wandered into the world of mirrors. This game is played by two people. Please split into two roles.",
    GameInstruction2: "The person who poses and the person who imitates. The person who poses should stand in front of the mirror. while the person who imitates should stand inside the mirror. If you can fully become the mirror for 90 second. you'll be able to escape from the mirror world.",
    Setup: "Please stand in front of and inside the mirror",
    GameStart: "Game will start now",
    GameEnd: "Game is over",
    GameComplete: "Well done. Game completed",
    Not_synchronized: "You are out of sync",
    synchronized_alert: "You are completely out of sync",
    FoundManInTheMirror: "Found a person in the mirror",
    LostManInTheMirror: "Lost the person in the mirror",
    FoundManInFrontOfTheMirror: "Found a person in front of the mirror",
    LostManInFrontOfTheMirror: "Lost the person in front of the mirror",
    LostPlayers: "Players are lost",
    ReadScore: "points",
    Announce_10sec: "Let's match our poses. Earn points when they align.",
    Announce_30sec: "Keep moving while maintaining the pose to increase points.",
    Announce_60sec: "Bonus time! Points are doubled."
});

function get_navigation_en_speech(key) {
    switch (key) {
      case sound_navigation_list.GameInstruction:
        return speech_text_en.GameInstruction;
      case sound_navigation_list.Setup:
        return speech_text_en.Setup;
      case sound_navigation_list.GameStart:
        return speech_text_en.GameStart;
      case sound_navigation_list.GameEnd:
        return speech_text_en.GameEnd;
      case sound_navigation_list.GameComplete:
        return speech_text_en.GameComplete;
      case sound_navigation_list.Not_synchronized:
        return speech_text_en.not_synchronized;
      case sound_navigation_list.Synchronized_alert:
        return speech_text_en.synchronized_alert;
      case sound_navigation_list.FoundManInTheMirror:
        return speech_text_en.FoundManInTheMirror;
      case sound_navigation_list.LostManInTheMirror:
        return speech_text_en.LostManInTheMirror;
      case sound_navigation_list.FoundManInFrontOfTheMirror:
        return speech_text_en.FoundManInFrontOfTheMirror;
      case sound_navigation_list.LostManInFrontOfTheMirror:
        return speech_text_en.LostManInFrontOfTheMirror;
      case sound_navigation_list.LostPlayers:
        return speech_text_en.LostPlayers;
      case speech_text.Announce_10sec:              // speech en/jp
        return speech_text_en.Announce_10sec;
      case speech_text.Announce_30sec:              // speech en/jp
        return speech_text_en.Announce_30sec;
      case speech_text.Announce_60sec:              // speech en/jp
        return speech_text_en.Announce_60sec;

      default:
        return "";
    }
  }

var speech_string = [];
var pre_speech_string = "";

function speech(key){   // jp/en
    if (language === "ja") {
        speech_push(key);
      } else {
        speech_push(get_navigation_en_speech(key));
      }
}

function speech_push(string) {
    if (string == pre_speech_string) {
        return;
    }
    if (string == speech_text.GameStart || string == speech_text.GameEnd) { // Priority high speech
        speech_string.splice(0);    // remove all items
        console.log("speech cancel");
    }

    speech_string.push(string);
    pre_speech_string = string;
}

function speech_controller() {
    if (!sound_on) return;
    if (speech_string.length != 0) {
        console.log(speech_string[0]);
        if (speech_string[0] != "") {
            if (speech_string[0] == speech_text.ReadScore || speech_string[0] == speech_text_en.ReadScore) {
              const uttr = new SpeechSynthesisUtterance(game_score + speech_string[0])
              uttr.lang = language;
              uttr.volume = VOLUME_SPEECH;
              window.speechSynthesis.speak(uttr);
            } else {
              const uttr = new SpeechSynthesisUtterance(speech_string[0])
              if(language_instruction != ""){
                uttr.lang = language_instruction;
              }else{
                uttr.lang = language;
              }
              uttr.volume = VOLUME_SPEECH;
              window.speechSynthesis.speak(uttr);
            }
          }
        speech_string.shift();
    }
}

function speech_cancel_all(){
    speech_string.splice(0);    // remove all items
    window.speechSynthesis.cancel();
}

// Export functions
window.initSound_bgm = initSound_bgm;
window.playBGM = playBGM;
window.stopBGM = stopBGM;
window.SetBGMVolume = SetBGMVolume;
window.initSound_se = initSound_se;
window.playSound_se = playSound_se;
window.initSound_navigation = initSound_navigation;
window.playNavigationSound = playNavigationSound;
window.playNavigationQueue = playNavigationQueue;
window.speech = speech;
window.speech_controller = speech_controller;
window.speech_cancel_all = speech_cancel_all;