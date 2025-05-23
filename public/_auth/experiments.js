(function () {
  window.EXPERIMENTS = {
    DISPLAY_CONTINUE_BUTTON_IF_NOT_REDIRECT: { id: 1000003, rollout: 1, defaultValue: !0, expiration: new Date("April 1, 2020"), stagingRollout: 1 }, CHECK_CONTINUE_URL_IS_AUTHORIZED: { id: 1000004, rollout: 1, defaultValue: !0, expiration: new Date("September 1, 2020"), stagingRollout: 1 }, POPUP_POST_MESSAGE_TO_IFRAME: { id: 1000005, rollout: 1, defaultValue: !0, expiration: new Date("October 1, 2020"), stagingRollout: 1 }, CHECK_OAUTH_STATE_STORED_BEFORE_REDIRECT: {
      id: 1000006, rollout: 1, defaultValue: !0, expiration: new Date("April 1, 2021"),
      stagingRollout: 1
    }, CHECK_REDIRECT_URL_IS_AUTHORIZED: { id: 1000007, rollout: 1, defaultValue: !0, expiration: new Date("June 1, 2024"), stagingRollout: 1 }
  };
}).call(this);
