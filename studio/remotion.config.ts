import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(2);
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/Root.tsx");
Config.setChromiumOpenGlRenderer("angle");
