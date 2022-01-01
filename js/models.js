"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function!
    return new URL(this.url).host;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  //  const response = await axios({
  //   url: `https://hack-or-snooze-v3.herokuapp.com/stories`,
  //   method: "GET", params:{skip: 25}
  // });

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, story) {
    const body = {token: currentUser.loginToken, story};
    const res = await axios.post(`${BASE_URL}/stories`, body);
    const storyRes = res.data.story;
    console.log("addStory res", res);
    story.storyId = storyRes.storyId;
    story.username = storyRes.username;
    story.createdAt = storyRes.createdAt;

    return new Story(story);
    // UNIMPLEMENTED: complete this function!
  }

  // ** deletes a story from server
  async deleteStory(storyId) {
    try {
      const res = await axios({
        url: `${BASE_URL}/stories/${storyId}`, 
        method: 'DELETE',
        data: {token: currentUser.loginToken}
      })
    }
    catch (err) {
      console.log(err);
    }
  }
  // ** lets logged in user edit their own stories
  async editStory(token, storyId, story) {
    const res = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "PATCH",
      data: {token: token, "story": story}
    });
    return new Story(res.data.story);
  }

}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = [],
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
    this.deletedStories = JSON.parse(localStorage.getItem("deletedStories"));
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    // try{
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });
  
      let { user } = response.data
  
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        response.data.token
      );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
  async addFavorites(story) {
    this.favorites.push(story);
  }

  async addStoryToUserFavorites(username, storyId, method) {
    const token = this.loginToken;
    const res = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: method,
      data: {token}
    });
    const resFavorites = res.data.user.favorites;
    if(method === 'POST') {
      this.favorites.push(new Story(resFavorites[resFavorites.length - 1]));
      console.log('push favorites', this.favorites);
      return;
    }
    this.favorites = this.deleteUserFavorite(storyId);
    console.log('deleted favs', this.favorites);
  }

  deleteUserFavorite(storyId) {
    console.log(stories);
    return this.favorites.filter((story) => {
      if(story.storyId !== storyId) {
        return story;
      }
    })
  }

  static async updateUserProfile(updatedProfile) {
    try {
    const response = await axios({
      url: `${BASE_URL}/users/${currentUser.username}`,
      method: "PATCH",
      data: {token: currentUser.loginToken, user: updatedProfile}
    });
  
    let { user } = response.data;
  
    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      currentUser.loginToken
    );
    }
    catch (err) {
      console.log(err);
      handleUpdateUserProfileError(err);
      return null;
    }
  }
}

//use local storage, push new story to this.favorites, use filter to remove story