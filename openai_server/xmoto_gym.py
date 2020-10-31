#!/usr/bin/env python

# Gym dependencies
import gym
from gym import spaces
from gym.utils import seeding

# Vectors
import numpy as np

KEYCODE_UP = 38
KEYCODE_LEFT = 37
KEYCODE_DOWN = 40
KEYCODE_RIGHT = 39
KEYCODE_SPACE = 32
KEYCODE_EJECT = 69
KEYCODE_WAIT = 0

ACTIONS = [
    KEYCODE_UP,
    KEYCODE_LEFT,
    KEYCODE_DOWN,
    KEYCODE_RIGHT,
    KEYCODE_SPACE,
    # KEYCODE_EJECT,
    KEYCODE_WAIT,
]


class XmotoEnv(gym.Env):

    """
    Start is used to define if we should keep the key down or not
    """

    def _take_action(self, key):
        if key != self.previous_key_pressed:
            print(f"keyboard.press({self.previous_key_pressed})")
        if str(key) == "NA":
            return
        print(f"keyboard.press({key})")
        self.previous_key_pressed = key

    def _get_state(self):
        # return capture_screen()
        return {""}

    def __init__(self):
        self.previous_score = 0
        self.state = None
        self.seed()
        self.previous_key_pressed = KEYCODE_DOWN
        self.TOTAL_WINS = 0
        self.action_space = spaces.Discrete(len(ACTIONS))
        self.observation_space = spaces.Box(
            low=0, high=255, shape=(150, 200, 4), dtype=np.uint8)

    def seed(self, seed=None):
        self.np_random, seed1 = seeding.np_random(seed)
        # Derive a random seed. This gets passed as a uint, but gets
        # checked as an int elsewhere, so we need to keep it below
        # 2**31.
        seed2 = seeding.hash_seed(seed1 + 1) % 2**31
        return [seed1, seed2]

    def step(self, action):
        """
        The agent takes a step in the environment.
        Parameters
        ----------
        action : int
        Returns
        -------
        ob, reward, episode_over, info : tuple
            ob (object) :
                an environment-specific object representing your observation of
                the environment.
            reward (float) :
                amount of reward achieved by the previous action. The scale
                varies between environments, but the goal is always to increase
                your total reward.
            episode_over (bool) :
                whether it's time to reset the environment again. Most (but not
                all) tasks are divided up into well-defined episodes, and done
                being True indicates the episode has terminated. (For example,
                perhaps the pole tipped too far, or you lost your last life.)
            info (dict) :
                diagnostic information useful for debugging. It can sometimes
                be useful for learning (for example, it might contain the raw
                probabilities behind the environment's last state change).
                However, official evaluations of your agent are not allowed to
                use this for learning.
      """

        # Speed up
        reward = -0.1

        # Frameskip stuff
        """
        if isinstance(self.frameskip, int):
            num_steps = self.frameskip
        else:
            num_steps = self.np_random.randint(self.frameskip[0], self.frameskip[1])
        """
        self._take_action(ACTIONS[action])

        tmpState = self._get_state()

        dead = False

        win = False

        # score = recognize_score(tmpState[1][0:0+30,100:100+30])
        score = 1

        episode_over = dead | win

        if score != '':
            if int(score) < self.previous_score:
                print("Hit score point !")
                reward += 100
            self.previous_score = int(score)

        if dead:
            reward += -1
            self.previous_score = 0
        if win:
            reward += 100
            self.TOTAL_WINS += 1
            self.previous_score = 0
            print("Total wins " + str(self.TOTAL_WINS))

        return tmpState[0], reward, episode_over, {dead}

    def reset(self):
        self._take_action("enter")
        return self._get_state()[0]


def run_xmoto_gym():
    env = XmotoEnv()
    env.reset()
    steps = 0
    total_reward = 0
    a = np.array([0.0 for _ in range(len(ACTIONS))])
    while True:
        _state, reward, done, _info = env.step(a)
        total_reward += reward
        if steps % 20 == 0 or done:
            print(f"step {steps} total_reward {total_reward:+0.2f}")
        steps += 1

        if done:
            break