import React from "react";
// Testing a magic import ~
import Home from "~/core/components/home";

export default {
  title: "VN/Home",
  component: Home,
  // decorators: [],
};

export const HomeStory = () => <Home />;
HomeStory.storyName = "Home";
