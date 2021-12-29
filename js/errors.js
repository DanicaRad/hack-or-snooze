
async function handleUpdateUserProfileError(err) {
    $updateUserProfileMessage.show();
    if(err.status === 404) {
        $updateUserProfileMessage.text("Sorry we couldn't find that user.");
    }
    else {
        $updateUserProfileMessage.text("Cannot update user profile");
    }
}

async function handleLoginOrSignupError(err) {
    console.log("error!", err);
    $errorMessage.show();
    if(err.response.status === 401) {
        $("#login-div").append($errorMessage);
        $errorMessage.text("Invalid login credentials");
    }
    if(err.response.status === 404) {
        $("#login-div").append($errorMessage);
        $errorMessage.text("Sorry we couldn't find that user");
    }
    if(err.response.status === 409) {
        $("#signup-div").append($errorMessage);
        $errorMessage.text("That username is already taken");
    }
}