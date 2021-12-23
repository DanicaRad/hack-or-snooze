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
  const checked = showStarOnUserFavorites(story);
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

function showStarOnUserFavorites(story) {
  let checked = '';
  for(let userStory of currentUser.favorites) {
    if (userStory.storyId === story.storyId) {
      checked = "checked";
    }
  }
  return checked;
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
  const method = evt.target.checked ? 'POST' : 'DELETE'; 
  const storyId = evt.target.closest("li").id;
  currentUser.addStoryToUserFavorites(currentUser, storyId, method);
}

// ** shows users own stories

$navUserStories.on("click", showUserStories);

async function showUserStories(stories) {
  $allStoriesList.empty();
  for(let story of currentUser.ownStories) {
    const $userStory = generateStoryMarkup(story);
    $allStoriesList.append($userStory);
  }
}

$navFavorites.on("click", showUserFavorites);

function showUserFavorites() {
  $allStoriesList.empty();
  for(let story of currentUser.favorites) {
    const $favStory = generateStoryMarkup(story);
    $allStoriesList.append($favStory);
  }
}

