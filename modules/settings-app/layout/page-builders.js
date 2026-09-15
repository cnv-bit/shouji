import { buildSettingsHomePageHtml as buildSettingsHomePageHtmlImpl } from './page-builders/overview-builders.js';
import {
    buildAppearancePageHtml as buildAppearancePageHtmlImpl,
    buildButtonStylePageHtml as buildButtonStylePageHtmlImpl,
} from './page-builders/appearance-builders.js';

export function buildSettingsHomePageHtml(args) { return buildSettingsHomePageHtmlImpl(args); }
export function buildAppearancePageHtml(args) { return buildAppearancePageHtmlImpl(args); }
export function buildButtonStylePageHtml(args) { return buildButtonStylePageHtmlImpl(args); }
