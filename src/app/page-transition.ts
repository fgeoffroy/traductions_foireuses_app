import { NavOptions, createAnimation } from '@ionic/core';

// See https://www.damirscorner.com/blog/posts/20200501-CustomizingPageTransitionsInIonic5.html

interface TransitionOptions extends NavOptions {
  progressCallback?: (ani: Animation | undefined) => void;
  baseEl: any;
  enteringEl: HTMLElement;
  leavingEl: HTMLElement | undefined;
}

function getIonPageElement(element: HTMLElement) {
  if (element.classList.contains('ion-page')) {
    return element;
  }

  const ionPage = element.querySelector(
    ':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs'
  );
  if (ionPage) {
    return ionPage;
  }

  return element;
}

export function pageTransition(_: HTMLElement, opts: TransitionOptions) {
  const DURATION = 500;

  // root animation with common setup for the whole transition
  const rootTransition = createAnimation()
    .duration(opts.duration || DURATION)
    .easing('cubic-bezier(0.3,0,0.66,1)');

  // ensure that the entering page is visible from the start of the transition
  const enteringPage = createAnimation()
    .addElement(getIonPageElement(opts.enteringEl))
    .beforeRemoveClass('ion-page-invisible');

  // create animation for the leaving page
  const leavingPage = createAnimation().addElement(
    getIonPageElement(opts.leavingEl)
  );

  // actual customized animation
  if (opts.direction === 'forward') {
    // enteringPage.fromTo('transform', 'translateX(100%)', 'translateX(0)');
    enteringPage.fromTo('opacity', '0', '1');
    leavingPage.fromTo('opacity', '1', '0');
  } else {
    // leavingPage.fromTo('transform', 'translateX(0)', 'translateX(100%)');
    leavingPage.fromTo('opacity', '1', '0');
    enteringPage.fromTo('opacity', '0', '1');
  }

  // include animations for both pages into the root animation
  rootTransition.addAnimation(enteringPage);
  rootTransition.addAnimation(leavingPage);
  return rootTransition;
}
