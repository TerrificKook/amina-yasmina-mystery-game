import { aminaYasminaStory } from './aminaYasmina.js';
import { polinaStory } from './polina.js';

export const stories = {
  [aminaYasminaStory.id]: aminaYasminaStory,
  [polinaStory.id]: polinaStory,
};

export const storyList = [aminaYasminaStory, polinaStory];

export const defaultStoryId = aminaYasminaStory.id;
