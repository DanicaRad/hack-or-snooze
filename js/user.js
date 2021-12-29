"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();
  try {
    // User.login retrieves user info from API and returns User instance
    // which we'll make the globally-available, logged-in user.
    currentUser = await User.login(username, password);
    console.log(currentUser);

    $loginForm.trigger("reset");

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  }
  catch (err) {
    handleLoginOrSignupError(err);
  }
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  try {
    currentUser = await User.signup(username, password, name);

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
    $signupForm.trigger("reset");
  }
  catch (err) {
    handleLoginOrSignupError(err);
  }
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();

  updateNavOnLogin();
}

$navUserProfile.on("click", showUserProfile)

function showUserProfile() {
  hidePageComponents();
  $userProfile.show();
  $("#profile-name").text(`${currentUser.name}`);
  $("#profile-username").text(`${currentUser.username}`);
  $("#profile-created-at").text(`${currentUser.createdAt.slice(0, 10)}`);
}

$("#update-profile").on("click", updateUserProfileForm);

function updateUserProfileForm(e) {
  e.preventDefault();
  $("#profile-name").html($(`<input id="new-name" type="text" placeholder="new name">`));
  $("#profile-username").html($(`<input id="new-username" type="text" placeholder="new username">`));
  $newPassword.show();
  $("#update-profile").off("click", updateUserProfileForm);
  $("#update-profile").on("click", collectUserProfileUpdateInfo);

}

async function collectUserProfileUpdateInfo(e) {
  e.preventDefault();
  
  const newProfileInfo = {};
  const newName = $("#new-name").val();
  if($("#new-name").val()) {
    newProfileInfo.name = $("#new-name").val();
  }
  if($("#new-username").val()) {
    newProfileInfo.username = $("#new-username").val();
  };
  if($("#new-password").val()) {
    newProfileInfo.password = $("#new-password").val();
  }
  try {
    currentUser = await User.updateUserProfile(newProfileInfo);
    showUpdatedUserProfile();
  }
  catch (err) {
    handleUpdateUserProfileError(err);
  }
}


async function showUpdatedUserProfile() {
  $("#update-profile").off("click", collectUserProfileUpdateInfo);
  $("#update-profile").on("click", updateUserProfileForm);
  showUserProfile();
    $updateUserProfileMessage.text("Profile Updated!");
    $updateUserProfileMessage.show();
}
