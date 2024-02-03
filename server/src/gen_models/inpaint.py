import omegaconf
import torch
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler

from .diffusion_base import DiffusionBase


class Inpaint(DiffusionBase):
    def __init__(
        self,
        cfg: omegaconf.dictconfig.DictConfig,
        size: int = 512,
        steps_all: int = 100,
    ) -> None:
        super().__init__(cfg, size)

    def inpaint(
        self, prompt, n_images, neg_prompt, img, guidance, steps, generator, seed
    ):
        pipe_inpaint = self.get_inpaint_pipe()

        inp_img = img["image"]
        mask = img["mask"]

        inp_img = inp_img.resize((512, 512))
        mask = mask.resize((512, 512))

        result = pipe_inpaint(
            prompt=prompt,
            image=inp_img,
            mask_image=mask,
            num_images_per_prompt=n_images,
            negative_prompt=neg_prompt,
            num_inference_steps=int(steps),
            guidance_scale=guidance,
            generator=generator,
        ).images
        self.update_state(f"Done. Seed: {seed}")

        return result

    def get_inpaint_pipe(self):
        pipe = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-2-inpainting",
            variant="fp16" if torch.cuda.is_available() else "fp32",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            # scheduler=scheduler # TODO currently setting scheduler here messes up the end result. A bug in Diffusers🧨
        ).to("cuda")
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        self.set_mem_optim(pipe)
        return pipe
