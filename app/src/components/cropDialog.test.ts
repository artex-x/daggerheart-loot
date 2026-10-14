/* CropDialog.svelte over the fake media port: the decode and its refusals, the square's
   moves by key, drag and zoom, «Готово» and its squeeze refusal, «Отмена» and Escape, the
   keys it keeps from a surrounding form, and the picture it frees when it goes
   (docs/specs/FEATURES.md, "Homebrew"). */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CropDialog from './CropDialog.svelte';
import { dict } from '../lib/dict.js';
import { fakeEnv, fakeMedia, fakePicture, type FakeMedia } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');

function open(
  file: Blob,
  media: FakeMedia = fakeMedia(),
  wrap: { form?: boolean } = {}
): {
  media: FakeMedia;
  onclose: ReturnType<typeof vi.fn>;
  ondone: ReturnType<typeof vi.fn>;
  onrefuse: ReturnType<typeof vi.fn>;
  container: HTMLElement;
  unmount: () => void;
} {
  const app = new AppState(fakeEnv({ media }));
  const onclose = vi.fn();
  const ondone = vi.fn();
  const onrefuse = vi.fn();
  const target = document.body.appendChild(document.createElement(wrap.form ? 'form' : 'div'));
  const view = render(CropDialog, { target, props: { app, file, onclose, ondone, onrefuse } });
  return { media, onclose, ondone, onrefuse, container: target, unmount: view.unmount };
}

const stage = (): HTMLElement => screen.getByRole('group', { name: t.hbArtStage });
const picture = (): HTMLImageElement => stage().querySelector('img') as HTMLImageElement;
const ready = async (): Promise<void> => {
  await screen.findByRole('group', { name: t.hbArtStage });
};

describe('decoding', () => {
  it('shows the loading line, then the stage with the picture centred at the smallest zoom', async () => {
    let go = (): void => undefined;
    const media = fakeMedia({ hold: new Promise((r) => (go = r)) });
    const { container } = open(fakePicture(1200, 800), media);
    expect(screen.getByRole('heading', { name: t.hbArtCrop })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(t.cloudLoading);
    expect(screen.queryByRole('button', { name: t.hbArtDone })).toBeNull();
    await expectNoA11yViolations(container);
    go();
    await ready();
    /* The decoding state's «Отмена» held the focus; the stage takes it once ready. */
    await waitFor(() => {
      expect(stage()).toHaveFocus();
    });
    expect(screen.getByLabelText<HTMLInputElement>(t.hbArtZoom).value).toBe('1');
    /* An 800 px square of a 1200 x 800 picture, centred: 200 px off the left edge. */
    expect(parseFloat(picture().style.left)).toBeCloseTo(-16, 5);
    expect(picture().style.top).toBe('6%');
    await expectNoA11yViolations(container);
  });

  for (const [name, file, reason] of [
    ['a file it cannot open', new Blob(['not a picture']), 'bad'],
    ['a short side under 160 px', fakePicture(159, 900), 'small'],
    ['a long side over 8000 px', fakePicture(8001, 900), 'huge']
  ] as const) {
    it(`refuses ${name}`, async () => {
      const { onrefuse, media, unmount } = open(file);
      await waitFor(() => {
        expect(onrefuse).toHaveBeenCalledWith(reason);
      });
      unmount();
      if (reason !== 'bad') expect(media.closed()).toBe(1);
    });
  }

  it('takes the sides at the bounds', async () => {
    const { onrefuse } = open(fakePicture(160, 8000));
    await ready();
    expect(onrefuse).not.toHaveBeenCalled();
  });
});

describe('moving the square', () => {
  it('moves by 2 % of the square per arrow, 10 % with Shift, and stops at the edge', async () => {
    open(fakePicture(1200, 800));
    await ready();
    const left = (): number => parseFloat(picture().style.left);
    const before = left();
    await fireEvent.keyDown(stage(), { key: 'ArrowRight' });
    /* 2 % of an 800 px square is 16 px, which draws 1.76 % of the stage. */
    expect(left()).toBeCloseTo(before - 1.76, 5);
    await fireEvent.keyDown(stage(), { key: 'ArrowLeft', shiftKey: true });
    expect(left()).toBeCloseTo(before - 1.76 + 8.8, 5);
    for (let i = 0; i < 10; i++)
      await fireEvent.keyDown(stage(), { key: 'ArrowLeft', shiftKey: true });
    expect(left()).toBeCloseTo(6, 5);
    const top = picture().style.top;
    await fireEvent.keyDown(stage(), { key: 'ArrowUp' });
    await fireEvent.keyDown(stage(), { key: 'ArrowDown' });
    expect(picture().style.top).toBe(top);
  });

  it('zooms with + and - and the range, between 1 and 4', async () => {
    open(fakePicture(1000, 1000));
    await ready();
    const zoom = screen.getByLabelText<HTMLInputElement>(t.hbArtZoom);
    const width = (): number => parseFloat(picture().style.width);
    expect(width()).toBeCloseTo(88, 5);
    await fireEvent.keyDown(stage(), { key: '+' });
    expect(zoom.value).toBe('1.1');
    await fireEvent.keyDown(stage(), { key: '-' });
    await fireEvent.keyDown(stage(), { key: '-' });
    expect(zoom.value).toBe('1');
    await fireEvent.input(zoom, { target: { value: '4' } });
    expect(width()).toBeCloseTo(352, 5);
    await fireEvent.keyDown(stage(), { key: '=' });
    expect(zoom.value).toBe('4');
    await fireEvent.keyDown(stage(), { key: 'x' });
    expect(zoom.value).toBe('4');
  });

  it('moves the square against a pointer drag', async () => {
    open(fakePicture(1200, 800));
    await ready();
    vi.spyOn(stage(), 'getBoundingClientRect').mockReturnValue({
      width: 352,
      height: 352
    } as DOMRect);
    const before = parseFloat(picture().style.left);
    await fireEvent.pointerDown(stage(), { pointerId: 1, clientX: 100, clientY: 100 });
    await fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 110, clientY: 100 });
    await fireEvent.pointerUp(stage(), { pointerId: 1 });
    /* 10 screen px over a 309.76 px frame is 25.8 source px of an 800 px square. */
    expect(parseFloat(picture().style.left)).toBeCloseTo(before + (10 / 352) * 100, 2);
    await fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 300, clientY: 100 });
    expect(parseFloat(picture().style.left)).toBeCloseTo(before + (10 / 352) * 100, 2);
  });

  it('takes no drag on a stage that has no size', async () => {
    open(fakePicture(1200, 800));
    await ready();
    const before = picture().style.left;
    await fireEvent.pointerDown(stage(), { pointerId: 1, clientX: 100, clientY: 100 });
    await fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 150, clientY: 100 });
    expect(picture().style.left).toBe(before);
  });
});

describe('finishing', () => {
  it('renders the two squares on «Готово» and hands them over', async () => {
    let go = (): void => undefined;
    const held = new Promise<void>((r) => (go = r));
    const media = fakeMedia();
    const render0 = media.render.bind(media);
    media.render = async (...a) => {
      await held;
      return render0(...a);
    };
    const { ondone, container } = open(fakePicture(1000, 1000), media);
    await ready();
    await userEvent.click(screen.getByRole('button', { name: t.hbArtDone }));
    expect(screen.getByRole('button', { name: t.hbArtDone })).toBeDisabled();
    expect(screen.getByRole('button', { name: t.cancel })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(t.cloudLoading);
    await expectNoA11yViolations(container);
    go();
    await waitFor(() => {
      expect(ondone).toHaveBeenCalledOnce();
    });
    const art = ondone.mock.calls[0]?.[0] as { full: Blob; thumb: Blob; ext: string };
    expect(art.ext).toBe('webp');
    expect(media.renders.map((r) => r.side)).toEqual([640, 160]);
    expect(media.renders[0]?.rect).toEqual({ x: 0, y: 0, side: 1000 });
  });

  it('refuses a picture that no quality squeezes under 200 KB', async () => {
    const { onrefuse, ondone } = open(
      fakePicture(1000, 1000),
      fakeMedia({ size: () => 300000 })
    );
    await ready();
    await userEvent.click(screen.getByRole('button', { name: t.hbArtDone }));
    await waitFor(() => {
      expect(onrefuse).toHaveBeenCalledWith('squeeze');
    });
    expect(ondone).not.toHaveBeenCalled();
  });

  it('closes on «Отмена», on Escape and on the backdrop, and answers once', async () => {
    const one = open(fakePicture(1000, 1000));
    await ready();
    await userEvent.click(screen.getByRole('button', { name: t.cancel }));
    expect(one.onclose).toHaveBeenCalledOnce();
    one.unmount();

    const two = open(fakePicture(1000, 1000));
    await ready();
    /* The browser closes a modal dialog on Escape and fires `close`. */
    (two.container.querySelector('dialog') as HTMLDialogElement).close();
    (two.container.querySelector('dialog') as HTMLDialogElement).dispatchEvent(
      new Event('close')
    );
    expect(two.onclose).toHaveBeenCalledOnce();
    two.unmount();

    const three = open(new Blob(['not a picture']));
    await waitFor(() => {
      expect(three.onrefuse).toHaveBeenCalledOnce();
    });
    await userEvent.click(three.container.querySelector('dialog') as HTMLDialogElement);
    expect(three.onclose).not.toHaveBeenCalled();
  });

  it('closes on a press that starts and ends on the backdrop, and keeps a press inside its box', async () => {
    const { container, onclose } = open(fakePicture(1000, 1000));
    await ready();
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    const box = dialog.querySelector('.box') as HTMLElement;
    await userEvent.click(box);
    /* A drag that starts inside the box and ends on the backdrop. */
    await fireEvent.pointerDown(box);
    await fireEvent.click(dialog);
    expect(onclose).not.toHaveBeenCalled();
    await fireEvent.pointerDown(dialog);
    await fireEvent.click(dialog);
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('keeps Enter and Ctrl+S from a surrounding form', async () => {
    const { container } = open(fakePicture(1000, 1000), fakeMedia(), { form: true });
    const submit = vi.fn();
    const keys = vi.fn();
    container.addEventListener('submit', submit);
    window.addEventListener('keydown', keys);
    try {
      await ready();
      const zoom = screen.getByLabelText(t.hbArtZoom);
      zoom.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{Control>}s{/Control}');
      /* false: the dialog prevented the browser's own "Save page". */
      expect(await fireEvent.keyDown(zoom, { key: 's', ctrlKey: true })).toBe(false);
      expect(submit).not.toHaveBeenCalled();
      expect(keys).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', keys);
    }
  });

  it('frees the decoded picture and its preview when it goes', async () => {
    const { media, unmount } = open(fakePicture(1000, 1000));
    await ready();
    unmount();
    expect(media.closed()).toBe(1);
    expect(media.released).toEqual(['blob:fake-1']);
  });

  it('frees a picture that decodes after it went', async () => {
    let go = (): void => undefined;
    const media = fakeMedia({ hold: new Promise((r) => (go = r)) });
    const { unmount } = open(fakePicture(1000, 1000), media);
    unmount();
    go();
    await waitFor(() => {
      expect(media.closed()).toBe(1);
    });
  });
});
