/* heartbeat_led.c
 *
 * Target : MSP430G2553 (e.g. MSP430 LaunchPad G2)
 * Toolchain: TI Code Composer Studio or msp430-gcc
 *
 * Hardware connections
 * --------------------
 *   P1.6  – LED anode  (330 Ω series resistor to GND)   ← TA0.1 PWM output
 *   P1.3  – Pot-1 wiper (pot ends to VCC and GND)       ← ADC A3  – BPM / period
 *   P1.4  – Pot-2 wiper (pot ends to VCC and GND)       ← ADC A4  – beat speed / rate
 *
 * MCLK / SMCLK = 1 MHz internal DCO (no crystal required)
 *
 * Behaviour
 * ---------
 *   The LED mimics a heartbeat (lub-dub) waveform using PWM brightness control.
 *
 *   Pot-1 (P1.3) – PERIOD control
 *       Full CCW → short pause between beats (~154 BPM)
 *       Full CW  → long  pause between beats (~40  BPM)
 *
 *   Pot-2 (P1.4) – RATE / speed control
 *       Full CCW → fast, snappy beat animation
 *       Full CW  → slow, smooth beat animation
 *
 * Architecture
 * ------------
 *   Timer A0  : 1 kHz PWM on P1.6 (CCR0 = period, CCR1 = duty, OUTMOD_7)
 *   Timer A1  : 5 ms animation tick (200 Hz, CCR0 interrupt)
 *   ADC10     : interrupt-driven, alternates between A3 and A4 each tick
 *   CPU       : sleeps in LPM0 between interrupts
 */

#include <msp430.h>
#include <stdint.h>

/* ── Timing constants ─────────────────────────────────────────────────────── */
#define SMCLK_HZ    1000000UL
#define TICK_HZ     200U                            /* 5 ms per tick           */
#define TICK_CCR    ((SMCLK_HZ / TICK_HZ) - 1U)    /* TA1 CCR0 value = 4999   */
#define PWM_TOP     999U                            /* ~1 kHz PWM, 1000 steps  */

/* ── Heartbeat waveform (24 steps, values 0–255) ──────────────────────────── */
/*   Steps  0–10 : "lub"  – sharp rise to 255, rapid fall                      */
/*   Steps 11–20 : "dub"  – smaller secondary peak                             */
/*   Steps 21–23 : brief tail-off before the configurable quiet pause          */
static const uint8_t beat_wave[24] = {
      0,  12,  45, 110, 195, 252, 255, 235,
    190, 140,  95,  70,  85, 115, 148, 165,
    155, 130,  98,  65,  35,  14,   3,   0
};
#define BEAT_LEN    24U

/* ── Shared ADC results (written in ADC10 ISR, read in TA1 ISR) ───────────── */
static volatile uint16_t pot_period = 512;   /* A3, 0–1023 */
static volatile uint16_t pot_rate   = 512;   /* A4, 0–1023 */

/* ── Animation state (only touched inside TA1 ISR) ───────────────────────── */
static uint8_t  beat_idx  = 0;
static uint8_t  in_pause  = 0;
static uint16_t step_acc  = 0;
static uint16_t pause_acc = 0;

/* ── ADC sequencing state ─────────────────────────────────────────────────── */
/* 0 = A3 conversion in progress (or idle, ready to start A3)                  */
/* 1 = A4 conversion in progress                                                */
static volatile uint8_t adc_phase = 0;

/* ── Helper: set LED brightness 0–255 ────────────────────────────────────── */
static inline void pwm_set(uint8_t b)
{
    /* OUTMOD_7: duty = CCR1 / CCR0, so scale b linearly to PWM_TOP */
    TA0CCR1 = (uint16_t)(((uint32_t)b * PWM_TOP) / 255U);
}

/* ── Helper: start a single ADC10 conversion ─────────────────────────────── */
static void adc_begin(uint8_t inch, uint8_t ae_mask)
{
    ADC10CTL0 &= ~ENC;
    ADC10CTL1  = (ADC10CTL1 & ~INCH_15) | inch | ADC10SSEL_3; /* SMCLK */
    ADC10AE0   = ae_mask;
    ADC10CTL0 |= ENC | ADC10SC;
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
int main(void)
{
    WDTCTL = WDTPW | WDTHOLD;      /* stop watchdog */

    /* P1.6 → TA0.1 PWM output */
    P1DIR  |=  BIT6;
    P1SEL  |=  BIT6;
    P1SEL2 &= ~BIT6;

    /* P1.3, P1.4 → analog inputs (high-impedance; ADC10AE0 controls mux) */
    P1DIR  &= ~(BIT3 | BIT4);
    P1SEL  &= ~(BIT3 | BIT4);

    /* Timer A0 – 1 kHz PWM, up mode, SMCLK */
    TA0CCR0  = PWM_TOP;
    TA0CCTL1 = OUTMOD_7;           /* Reset/Set: high duty ∝ CCR1 */
    TA0CCR1  = 0;
    TA0CTL   = TASSEL_2 | MC_1 | TACLR;

    /* Timer A1 – 5 ms animation tick, up mode, SMCLK */
    TA1CCR0  = TICK_CCR;
    TA1CCTL0 = CCIE;
    TA1CTL   = TASSEL_2 | MC_1 | TACLR;

    /* ADC10 – 16-cycle sample hold, interrupt-driven */
    ADC10CTL0 = ADC10SHT_2 | ADC10ON | ADC10IE;
    adc_begin(INCH_3, BIT3);       /* start first sample (pot_period) */

    __enable_interrupt();

    /* CPU sleeps; all work happens in ISRs */
    for (;;)
        __bis_SR_register(LPM0_bits | GIE);
}

/* ── ADC10 ISR: store result, trigger next channel ───────────────────────── */
#pragma vector = ADC10_VECTOR
__interrupt void ADC10_ISR(void)
{
    if (adc_phase == 0) {
        pot_period = ADC10MEM;      /* store A3 result */
        adc_phase  = 1;
        adc_begin(INCH_4, BIT4);   /* start A4 (pot_rate)  */
    } else {
        pot_rate  = ADC10MEM;       /* store A4 result */
        adc_phase = 0;              /* sequence complete; TA1 will restart */
    }
}

/* ── Timer A1 ISR: advance heartbeat animation every 5 ms ────────────────── */
#pragma vector = TIMER1_A0_VECTOR
__interrupt void TA1_CCR0_ISR(void)
{
    /*
     * step_thresh (1–4): how many 5 ms ticks elapse between waveform steps.
     *   pot_rate = 0    → thresh = 1 →  5 ms/step (snappy)
     *   pot_rate = 1023 → thresh = 4 → 20 ms/step (smooth)
     */
    const uint16_t step_thresh = 1U + (pot_rate >> 8);

    /*
     * pause_ticks (30–250): silent ticks between heartbeat cycles.
     *   pot_period = 0    → 30  ticks = 150 ms  → ~154 BPM (with fast beat)
     *   pot_period = 1023 → 250 ticks = 1250 ms →  ~40 BPM (with slow beat)
     *
     *   Actual BPM also depends on beat animation speed (step_thresh).
     *   At default mid-pot settings the rate is approximately 64 BPM.
     */
    const uint16_t pause_ticks = 30U + ((uint32_t)pot_period * 220U / 1023U);

    if (!in_pause) {
        if (++step_acc >= step_thresh) {
            step_acc = 0;
            if (++beat_idx >= BEAT_LEN) {
                /* waveform finished → enter quiet pause */
                beat_idx  = 0;
                in_pause  = 1;
                pause_acc = 0;
                pwm_set(0);
            } else {
                pwm_set(beat_wave[beat_idx]);
            }
        }
        /* between sub-steps: hold current brightness (no update needed) */
    } else {
        if (++pause_acc >= pause_ticks) {
            in_pause = 0;
            beat_idx = 0;
            step_acc = 0;
            /* LED stays at 0 until next tick advances beat_idx to 1 */
        }
    }

    /* Restart ADC sequence only after the previous one has fully completed */
    if (adc_phase == 0)
        adc_begin(INCH_3, BIT3);
}
