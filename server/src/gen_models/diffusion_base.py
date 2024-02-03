from typing import Any


class DiffusionBase:
    def __init__(self, cfg: Any, size: int = 512) -> None:
        self.cfg = cfg
        self.size = size
        # self.steps_all = cfg.steps_all
        self.state = None

    def set_mem_optim(self, pipe):
        if self.cfg.attn_slicing_enabled:
            pipe.enable_attention_slicing()
        else:
            pipe.disable_attention_slicing()

        if self.cfg.mem_eff_attn_enabled:
            pipe.enable_xformers_memory_efficient_attention()
        else:
            pipe.disable_xformers_memory_efficient_attention()

    def update_state(self, state):
        # print(state)
        self.state = state

    def pipe_callback(self, step: int, steps_all: int, _):
        self.update_state(
            f"{step}/{steps_all} steps"
        )  # \nTime left, sec: {timestep/100:.0f}")
