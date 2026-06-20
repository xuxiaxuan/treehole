package com.xxx.treehole.dto.tarot;

import lombok.Data;

import java.util.List;

/**
 * 塔罗牌 DTO。
 * suit: null/major=大阿尔卡那；wands/cups/swords/pentacles=小阿尔卡那花色
 */
@Data
public class TarotCard {

    private Integer id;
    private String name;
    private String nameEn;
    private String suit;
    private List<String> keywords;
    private String upright;
    private String reversed;
}
