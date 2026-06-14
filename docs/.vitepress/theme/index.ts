import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import HeroRotator from "./components/HeroRotator.vue";
import MiniDemo from "./components/MiniDemo.vue";
import HomePage from "./components/HomePage.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("HeroRotator", HeroRotator);
    app.component("MiniDemo", MiniDemo);
    app.component("HomePage", HomePage);
  },
} satisfies Theme;
