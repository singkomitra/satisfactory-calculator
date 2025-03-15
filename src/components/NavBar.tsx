"use client";

import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useBreakpointValue,
  useDisclosure,
  Collapsible,
  Input,
  PopoverArrow,
  PopoverBody,
  PopoverRoot,
  PopoverTitle,
  HStack
} from "@chakra-ui/react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";

const NavBar = observer(function NavBar() {
  return (
    <HStack width="100%" gap={20} height={68} bg="background._dark">
      {tabs.map((tab) => {
        return <NavigationSubMenuTab name={tab} />;
      })}
    </HStack>
  );
});

type NavigationSubMenuProps = {
  name: string;
};
const NavigationSubMenuTab: React.FC<NavigationSubMenuProps> = () => {
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          Click me
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <PopoverTitle fontWeight="medium">Naruto Form</PopoverTitle>
          <Text my="4">Naruto is a Japanese manga series written and illustrated by Masashi Kishimoto.</Text>
          <Input placeholder="Your fav. character" size="sm" />
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};

const tabs = ["Tab 1", "Tab 2", "Tab 3"];

export default NavBar;
