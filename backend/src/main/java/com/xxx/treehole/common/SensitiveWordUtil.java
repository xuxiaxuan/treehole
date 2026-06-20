package com.xxx.treehole.common;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * 敏感词检测：基于 Trie 的多模式匹配。
 * 词表来源：classpath:sensitive-words.txt，每行一个词。
 */
@Slf4j
@Component
public class SensitiveWordUtil {

    private Set<String> words;
    private volatile TrieNode root;

    public SensitiveWordUtil() {
        this.words = new HashSet<>();
    }

    /** 测试用构造器 */
    public SensitiveWordUtil(Set<String> words) {
        this.words = new HashSet<>(words);
        buildTrie();
    }

    @PostConstruct
    public void init() {
        var resource = new ClassPathResource("sensitive-words.txt");
        if (resource.exists()) {
            try (var is = resource.getInputStream()) {
                String text = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Arrays.stream(text.split("\n"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && !s.startsWith("#"))
                        .forEach(words::add);
            } catch (IOException e) {
                log.warn("Failed to read sensitive-words.txt: {}", e.getMessage());
            }
        } else {
            log.warn("sensitive-words.txt not found, starting with empty dict");
        }
        buildTrie();
        log.info("Loaded {} sensitive words", words.size());
    }

    private void buildTrie() {
        TrieNode r = new TrieNode();
        for (String word : words) {
            TrieNode cur = r;
            for (char c : word.toCharArray()) {
                cur = cur.children.computeIfAbsent(c, k -> new TrieNode());
            }
            cur.isEnd = true;
        }
        this.root = r;
    }

    /** 命中首个敏感词则返回；否则 empty。 */
    public Optional<String> check(String text) {
        if (text == null || text.isEmpty()) return Optional.empty();
        for (int i = 0; i < text.length(); i++) {
            TrieNode cur = root;
            for (int j = i; j < text.length(); j++) {
                cur = cur.children.get(text.charAt(j));
                if (cur == null) break;
                if (cur.isEnd) return Optional.of(text.substring(i, j + 1));
            }
        }
        return Optional.empty();
    }

    /** 返回所有命中（去重，保留顺序）。 */
    public List<String> checkAll(String text) {
        Set<String> hits = new LinkedHashSet<>();
        if (text == null || text.isEmpty()) return new ArrayList<>();
        for (int i = 0; i < text.length(); i++) {
            TrieNode cur = root;
            for (int j = i; j < text.length(); j++) {
                cur = cur.children.get(text.charAt(j));
                if (cur == null) break;
                if (cur.isEnd) hits.add(text.substring(i, j + 1));
            }
        }
        return new ArrayList<>(hits);
    }

    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd;
    }
}
