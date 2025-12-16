import { sequence, trigger, animate, style, group, query, transition, animateChild, state, animation, useAnimation, stagger } from '@angular/animations';

const customAnimation = animation([
    style({
        opacity  : '{{opacity}}',
        transform: 'scale({{scale}}) translate3d({{x}}, {{y}}, {{z}})'
    }),
    animate('{{duration}} {{delay}} cubic-bezier(0.0, 0.0, 0.2, 1)', style('*'))
], {
    params: {
        duration: '200ms',
        delay   : '0ms',
        opacity : '0',
        scale   : '1',
        x       : '0',
        y       : '0',
        z       : '0'
    }
});

export const appAnimations = [

    trigger('animate', [transition('void => *', [useAnimation(customAnimation)])]),

    trigger('fadeInOut', [
        transition(":enter", [
            style({ opacity: 0 }),
            animate(300, style({ opacity: 1 }))
         ]),
         transition(":leave", [animate(300, style({ opacity: 0 }))])
    ]),

    trigger('slideInOut', [
        state('0', style({
            height: '0px'
        })),
        state('1', style({
            height: '*'
        })),
        transition('1 => 0', animate('300ms ease-out')),
        transition('0 => 1', animate('300ms ease-in'))
    ]),

    trigger('slideIn', [
        transition('void => left', [
                style({
                    transform: 'translateX(100%)'
                }),
                animate('300ms ease-in',
                    style({
                        transform: 'translateX(0)'
                    })
                )
            ]
        ),
        transition('left => void', [
                style({
                    transform: 'translateX(0)'
                }),
                animate('300ms ease-in',
                    style({
                        transform: 'translateX(-100%)'
                    })
                )
            ]
        ),
        transition('void => right', [
                style({
                    transform: 'translateX(-100%)'
                }),
                animate('300ms ease-in',
                    style({
                        transform: 'translateX(0)'
                    })
                )
            ]
        ),
        transition('right => void', [
                style({
                    transform: 'translateX(0)'
                }),
                animate('300ms ease-in',
                    style({
                        transform: 'translateX(100%)'
                    })
                )
            ]
        )
    ]),
];
