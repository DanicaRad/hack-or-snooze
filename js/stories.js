"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

$storyForm.on("submit", submitNewStory);

// ** Gets user new story input from story-form
async function submitNewStory() {
  const userStory = {
    title: $("#new-story-title").val(),
    author: $("#new-story-author").val(),
    url: $("#new-story-url").val()
  }
  const newStory = await storyList.addStory('currentUser', userStory);
  const newStoryMarkup = generateStoryMarkup(newStory);
  $allStoriesList.prepend(newStoryMarkup);
  $storyForm.hide();
  addNewUserStoryToOwnStories(newStory);
  $storyForm.trigger("reset");
}

async function addNewUserStoryToOwnStories(newStory) {
  let newUserStory;
  for await(let story of currentUser.ownStories) {
    if(story.storyId !== newStory.storyId) {
      newUserStory = newStory;
    }
  }
  currentUser.ownStories.push(newUserStory);
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const checked = checkStarOnUserFavorites(story);
  return $(`
      <li id="${story.storyId}">
      <input class="star" type="checkbox" ${checked}>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function checkStarOnUserFavorites(story) {
  let checked = '';
  if(currentUser) {
  for(let userStory of currentUser.favorites) {
    if (userStory.storyId === story.storyId) {
      checked = "checked";
    }
  }
    return checked;
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// ** adds story to user's favorites when star is clicked

$storiesList.on("click", ".star", addStoryToFavoritesOnClick);

function addStoryToFavoritesOnClick(evt) {
  if(currentUser) {
  const method = evt.target.checked ? 'POST' : 'DELETE'; 
  const storyId = evt.target.closest("li").id;
  currentUser.addStoryToUserFavorites(currentUser, storyId, method);
  }
}

// ** shows users own stories

$navUserStories.on("click", showUserStories);

async function showUserStories(stories) {
  $allStoriesList.empty();
  if(currentUser.ownStories.length < 1) {
    hidePageComponents();
    $errorMessage.show();
    $errorMessage.text("You haven't added any stories yet!");
  }

  $(".edit-story").show();
  for (let story of currentUser.ownStories) {
    const $userStory = generateStoryMarkup(story);
    $userStory.prepend(`<i class="fas fa-edit"></i>`);
    $userStory.prepend(`<i class="far fa-trash-alt"></i>`);
    $allStoriesList.append($userStory);

    $(`#${story.storyId}`).on("click", ".fa-edit", showEditUserStoriesUi);
    $(".fa-trash-alt").on("click", deleteStoryFromUi);
  }
}


// show form to allow user to edit their own stories
function showEditUserStoriesUi(evt) {
  console.debug("editUserStories");

  const storyId = evt.target.closest("li").id;
  const $editStoryAuthor = $(`<input type="text" id="edit-story-author" placeholder="new author name">`);
  $(`#${storyId} > .story-author`).after($editStoryAuthor);

  const $editStoryName = $(`<input type="text" id="edit-story-name" placeholder="new story name">`);
  $(`#${storyId} > .story-link`).after($editStoryName);

  const $editStoryUrl = $(`<input type="url" id="edit-story-url" placeholder="new story url">`);
  $(`#${storyId} > .story-hostname`).after($editStoryUrl);

  const $updateStoryButton = $(`<button id ="update-story">Update Story</button>`);
  $(`#${storyId}`).append($updateStoryButton);
  $updateStoryButton.on("click", collectUpdatedStoryInput);

}

// collects form input for user to edit their own stories and update in api
async function collectUpdatedStoryInput(e) {
  const storyId = e.target.closest("li").id;
  const story = {};
  const token = currentUser.loginToken;

  if($("edit-story-author").val()) {
    story.author = $("#edit-story-author").val();
  }
  if($("#edit-story-name").val()) {
    story.title = $("#edit-story-name").val();
  }
  if($("#edit-story-url").val()) {
    story.url = $("#edit-story-url").val();
  }
  const editedStory = await storyList.editStory(token, storyId, story);
  e.target.closest("li").append("Story update successful!");
  updateUserOwnStories(editedStory);
} 

// updates user objects own stories for UI
async function updateUserOwnStories(editedStory) {
  for(let story of currentUser.ownStories) {
    if (editedStory.storyId === story.storyId ) {
      story.title = editedStory.title;
      story.author = editedStory.author;
      story.url = editedStory.url;
      return;
    }
  }
}

$navFavorites.on("click", showUserFavorites);

async function showUserFavorites() {
  hidePageComponents();
  $allStoriesList.empty();
  for await(let story of currentUser.favorites) {
    const $favStory = generateStoryMarkup(story);
    $allStoriesList.append($favStory);
  }
  $allStoriesList.show();
}

function deleteStoryFromUi(evt) {
  console.debug("deleteStoryFromUi");
    const storyId = evt.target.closest("li").id;
    evt.target.closest("li").remove();

    currentUser.ownStories = currentUser.ownStories.filter((story) => {
      if (story.storyId != storyId) {
        return story;
      }
    })

    currentUser.deletedStories ? currentUser.deletedStories.push(storyId) : currentUser.deletedStories = [storyId];
    localStorage.setItem("deletedStories", JSON.stringify(currentUser.deletedStories));
    storyList.deleteStory(storyId);
}

// failed attempt at deleting stories from user UI if deleting story from API was unauthorized
function filterUiStoriesForUserDeletedStories() {
  if(currentUser.deletedStories) {
    const deletedStoriesIds = currentUser.deletedStories.toString();
    return storyList.stories.filter((story) => {
      if ( !deletedStoriesIds.includes(story.storyId)) {
        return story;
      }
    })
  }
}


