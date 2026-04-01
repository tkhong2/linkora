import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faHouse, faMagnifyingGlass, faUserGroup, faCommentDots,
  faBell, faUser, faMoon, faSun, faRightFromBracket,
  faThumbsUp, faComment, faShare, faEllipsis, faPen,
  faTrash, faLink, faImage, faXmark, faPaperPlane,
  faHeart, faFaceGrinSquint, faFaceSurprise, faFaceSadTear,
  faFaceAngry, faPlus, faCheck, faUserPlus, faUserMinus,
  faArrowLeft, faCircleCheck, faGlobe, faLocationDot,
  faClock, faEye, faReply, faChevronDown, faNewspaper,
  faSpinner, faCircle
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart as faHeartReg,
  faComment as faCommentReg,
  faThumbsUp as faThumbsUpReg,
  faBell as faBellReg
} from '@fortawesome/free-regular-svg-icons';

import App from './App.vue';
import router from './router';
import './assets/style.css';

library.add(
  faHouse, faMagnifyingGlass, faUserGroup, faCommentDots,
  faBell, faUser, faMoon, faSun, faRightFromBracket,
  faThumbsUp, faComment, faShare, faEllipsis, faPen,
  faTrash, faLink, faImage, faXmark, faPaperPlane,
  faHeart, faFaceGrinSquint, faFaceSurprise, faFaceSadTear,
  faFaceAngry, faPlus, faCheck, faUserPlus, faUserMinus,
  faArrowLeft, faCircleCheck, faGlobe, faLocationDot,
  faClock, faEye, faReply, faChevronDown, faNewspaper,
  faSpinner, faCircle,
  faHeartReg, faCommentReg, faThumbsUpReg, faBellReg
);

createApp(App)
  .use(createPinia())
  .use(router)
  .component('fa', FontAwesomeIcon)
  .mount('#app');
